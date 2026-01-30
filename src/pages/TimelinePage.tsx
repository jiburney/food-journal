/**
 * TimelinePage Component
 *
 * This is the main view of the app - shows all meals and flare-ups
 * in reverse chronological order (newest first).
 *
 * How it works:
 * 1. On mount, loads all meals from IndexedDB
 * 2. Groups meals by date ("Today", "Yesterday", or full date)
 * 3. Displays them in chronological order with newest first
 * 4. Allows deletion of individual meals
 */

import { useState, useEffect } from 'react'
import { getMeals, deleteMeal, getFlareups, deleteFlareup } from '../services/db'
import type { Meal, Flareup } from '../types'
import { format, isToday, isYesterday } from 'date-fns'
import FlareupLogger from '../components/flareup/FlareupLogger'
import MealEditor from '../components/meal/MealEditor'

export default function TimelinePage() {
  // State for meals and flare-ups loaded from IndexedDB
  const [meals, setMeals] = useState<Meal[]>([])
  const [flareups, setFlareups] = useState<Flareup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFlareupLogger, setShowFlareupLogger] = useState(false)

  // State for meal editor modal
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [showMealEditor, setShowMealEditor] = useState(false)

  // Load meals when component mounts
  // useEffect runs after the component renders
  useEffect(() => {
    loadMeals()
  }, []) // Empty dependency array = run once on mount

  /**
   * Load all meals and flare-ups from IndexedDB
   * Both are sorted newest first
   */
  const loadMeals = async () => {
    try {
      const [loadedMeals, loadedFlareups] = await Promise.all([
        getMeals(),
        getFlareups()
      ])
      setMeals(loadedMeals)
      setFlareups(loadedFlareups)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete a meal after user confirmation
   * Updates both IndexedDB and local state
   */
  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Delete this meal?')) return

    try {
      await deleteMeal(id)
      // Update local state to remove the deleted meal
      setMeals(prev => prev.filter(meal => meal.id !== id))
    } catch (error) {
      console.error('Failed to delete meal:', error)
      alert('Failed to delete meal. Please try again.')
    }
  }

  /**
   * Delete a flare-up after user confirmation
   * Updates both IndexedDB and local state
   */
  const handleDeleteFlareup = async (id: string) => {
    if (!confirm('Delete this flare-up?')) return

    try {
      await deleteFlareup(id)
      // Update local state to remove the deleted flare-up
      setFlareups(prev => prev.filter(flareup => flareup.id !== id))
    } catch (error) {
      console.error('Failed to delete flare-up:', error)
      alert('Failed to delete flare-up. Please try again.')
    }
  }

  /**
   * After saving a flare-up, reload the data to show it in timeline
   */
  const handleFlareupSaved = () => {
    loadMeals() // Reloads both meals and flareups
  }

  /**
   * Open the meal editor with the selected meal
   */
  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setShowMealEditor(true)
  }

  /**
   * After saving/deleting a meal, reload the data and close editor
   */
  const handleMealSaved = () => {
    loadMeals() // Reloads both meals and flareups
    setShowMealEditor(false)
    setEditingMeal(null)
  }

  /**
   * Format timestamp into friendly date strings
   * Returns: "Today", "Yesterday", or "January 20, 2026"
   */
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  /**
   * Format timestamp into 12-hour time format
   * Returns: "2:30 PM", "9:15 AM", etc.
   */
  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a')
  }

  /**
   * Combine meals and flare-ups into a single timeline
   * Both are sorted newest first, so we merge them by timestamp
   */
  type TimelineItem = (Meal & { itemType: 'meal' }) | (Flareup & { itemType: 'flareup' })

  const timelineItems: TimelineItem[] = [
    ...meals.map(m => ({ ...m, itemType: 'meal' as const })),
    ...flareups.map(f => ({ ...f, itemType: 'flareup' as const }))
  ].sort((a, b) => b.timestamp - a.timestamp) // Sort newest first

  /**
   * Group timeline items by date
   * Creates an object like: { "Today": [meal1, flareup1, meal2], "Yesterday": [...] }
   */
  const groupedItems = timelineItems.reduce((groups, item) => {
    const dateKey = formatDate(item.timestamp)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(item)
    return groups
  }, {} as Record<string, TimelineItem[]>)

  /**
   * Get associated meals for a flare-up
   * Used to display which meals might have caused the flare-up
   */
  const getAssociatedMeals = (flareup: Flareup): Meal[] => {
    return flareup.associatedMealIds
      .map(id => meals.find(m => m.id === id))
      .filter(Boolean) as Meal[]
  }

  // Show loading state while fetching from IndexedDB
  if (isLoading) {
    return (
      <div className="page-container">
        <header className="page-header">
          <h1>Timeline</h1>
        </header>
        <div className="page-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Timeline</h1>
        <button
          className="log-flareup-button"
          onClick={() => setShowFlareupLogger(true)}
        >
          🔴 Log Flare-up
        </button>
      </header>

      <div className="page-content">
        {timelineItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No meals logged yet</h2>
            <p>Start tracking by adding your first meal</p>
          </div>
        ) : (
          <div className="timeline">
            {Object.entries(groupedItems).map(([date, dateItems]) => (
              <div key={date} className="date-group">
                <h2 className="date-header">{date}</h2>
                <div className="timeline-list">
                  {dateItems.map((item) => {
                    if (item.itemType === 'flareup') {
                      // Render flare-up card
                      const associatedMeals = getAssociatedMeals(item)
                      return (
                        <div key={item.id} className={`flareup-card severity-${item.severity}`}>
                          <div className="flareup-header">
                            <span className="flareup-time">🔴 {formatTime(item.timestamp)}</span>
                            <span className={`severity-badge severity-${item.severity}`}>
                              {item.severity}
                            </span>
                          </div>
                          <p className="flareup-description">{item.description}</p>
                          {item.notes && (
                            <p className="flareup-notes">{item.notes}</p>
                          )}

                          {/* Associated meals */}
                          {associatedMeals.length > 0 && (
                            <div className="associated-meals">
                              <p className="associated-meals-label">
                                Associated meals ({associatedMeals.length}):
                              </p>
                              <div className="associated-meals-list">
                                {associatedMeals.slice(0, 3).map((meal) => (
                                  <div key={meal.id} className="associated-meal-item">
                                    <span className="associated-meal-time">
                                      {formatTime(meal.timestamp)}
                                    </span>
                                    <span className="associated-meal-desc">
                                      {meal.description}
                                    </span>
                                  </div>
                                ))}
                                {associatedMeals.length > 3 && (
                                  <p className="more-meals">
                                    + {associatedMeals.length - 3} more meal{associatedMeals.length > 4 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            className="delete-button"
                            onClick={() => handleDeleteFlareup(item.id)}
                            aria-label="Delete flare-up"
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    } else {
                      // Render meal card
                      return (
                        <div key={item.id} className="meal-card">
                          <div className="meal-header">
                            <span className="meal-time">{formatTime(item.timestamp)}</span>
                            {item.mealType && (
                              <span className="meal-type-badge">{item.mealType}</span>
                            )}
                          </div>
                          <p className="meal-description">{item.description}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="meal-tags">
                              {item.tags.map((tag) => (
                                <span key={tag} className="tag">{tag}</span>
                              ))}
                            </div>
                          )}
                          {item.notes && (
                            <p className="meal-notes">{item.notes}</p>
                          )}
                          <div className="meal-actions">
                            <button
                              className="edit-button"
                              onClick={() => handleEditMeal(item)}
                              aria-label="Edit meal"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteMeal(item.id)}
                              aria-label="Delete meal"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flare-up logger modal */}
      <FlareupLogger
        isOpen={showFlareupLogger}
        onClose={() => setShowFlareupLogger(false)}
        onSaved={handleFlareupSaved}
      />

      {/* Meal editor modal */}
      <MealEditor
        meal={editingMeal}
        isOpen={showMealEditor}
        onClose={() => {
          setShowMealEditor(false)
          setEditingMeal(null)
        }}
        onSaved={handleMealSaved}
      />

      <style>{`
        .page-container {
          min-height: 100vh;
          padding-bottom: 80px; /* Space for bottom nav */
        }

        .page-header {
          padding: var(--spacing-lg) var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-bg);
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-md);
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        .log-flareup-button {
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-danger);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .log-flareup-button:hover {
          background-color: var(--color-danger-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .log-flareup-button:active {
          transform: translateY(0);
        }

        .page-content {
          padding: var(--spacing-md);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          text-align: center;
          min-height: 400px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }

        .empty-state h2 {
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-text-secondary);
          font-size: 14px;
        }

        .timeline {
          max-width: 800px;
          margin: 0 auto;
        }

        .date-group {
          margin-bottom: var(--spacing-xl);
        }

        .date-header {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 var(--spacing-md) 0;
          padding-bottom: var(--spacing-sm);
          border-bottom: 2px solid var(--color-border);
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .meal-card {
          position: relative;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s ease;
        }

        .meal-card:hover {
          box-shadow: var(--shadow-md);
        }

        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .meal-time {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .meal-type-badge {
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background-color: var(--color-primary-light);
          color: var(--color-primary-dark);
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .meal-description {
          font-size: 15px;
          color: var(--color-text);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: 1.5;
        }

        .meal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .tag {
          padding: 4px 10px;
          background-color: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 12px;
          color: var(--color-text);
        }

        .meal-notes {
          font-size: 13px;
          color: var(--color-text-secondary);
          font-style: italic;
          margin: var(--spacing-sm) 0 0 0;
          padding-top: var(--spacing-sm);
          border-top: 1px dashed var(--color-border);
        }

        .meal-actions {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          display: flex;
          gap: var(--spacing-xs);
        }

        .edit-button,
        .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: var(--spacing-xs);
          opacity: 0.5;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .edit-button:hover,
        .delete-button:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .edit-button:active,
        .delete-button:active {
          transform: scale(0.95);
        }

        .flareup-card .delete-button {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
        }

        /* Flare-up card styles */
        .flareup-card {
          position: relative;
          background: var(--color-bg);
          border: 2px solid var(--color-danger);
          border-left: 6px solid var(--color-danger);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s ease;
        }

        .flareup-card:hover {
          box-shadow: var(--shadow-md);
        }

        /* Severity-specific border colors */
        .flareup-card.severity-mild {
          border-color: var(--color-severity-mild);
          border-left-color: var(--color-severity-mild);
        }

        .flareup-card.severity-moderate {
          border-color: var(--color-severity-moderate);
          border-left-color: var(--color-severity-moderate);
        }

        .flareup-card.severity-severe {
          border-color: var(--color-severity-severe);
          border-left-color: var(--color-severity-severe);
        }

        .flareup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .flareup-time {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-danger);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          color: white;
        }

        .severity-badge.severity-mild {
          background-color: var(--color-severity-mild);
        }

        .severity-badge.severity-moderate {
          background-color: var(--color-severity-moderate);
        }

        .severity-badge.severity-severe {
          background-color: var(--color-severity-severe);
        }

        .flareup-description {
          font-size: 15px;
          color: var(--color-text);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: 1.5;
          font-weight: 500;
        }

        .flareup-notes {
          font-size: 13px;
          color: var(--color-text-secondary);
          font-style: italic;
          margin: var(--spacing-sm) 0;
          padding-top: var(--spacing-sm);
          border-top: 1px dashed var(--color-border);
        }

        /* Associated meals section */
        .associated-meals {
          margin-top: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }

        .associated-meals-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .associated-meals-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .associated-meal-item {
          display: flex;
          gap: var(--spacing-sm);
          font-size: 12px;
        }

        .associated-meal-time {
          color: var(--color-text-secondary);
          font-weight: 500;
          white-space: nowrap;
          min-width: 70px;
        }

        .associated-meal-desc {
          color: var(--color-text);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .more-meals {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin: 4px 0 0 0;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
