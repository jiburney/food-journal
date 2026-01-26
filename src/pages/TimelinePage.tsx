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
import { getMeals, deleteMeal } from '../services/db'
import type { Meal } from '../types'
import { format, isToday, isYesterday } from 'date-fns'

export default function TimelinePage() {
  // State for meals loaded from IndexedDB
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load meals when component mounts
  // useEffect runs after the component renders
  useEffect(() => {
    loadMeals()
  }, []) // Empty dependency array = run once on mount

  /**
   * Load all meals from IndexedDB
   * getMeals() returns them sorted newest first
   */
  const loadMeals = async () => {
    try {
      const loadedMeals = await getMeals()
      setMeals(loadedMeals)
    } catch (error) {
      console.error('Failed to load meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete a meal after user confirmation
   * Updates both IndexedDB and local state
   */
  const handleDelete = async (id: string) => {
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
   * Group meals by date for timeline display
   * Creates an object like: { "Today": [meal1, meal2], "Yesterday": [...] }
   */
  const groupedMeals = meals.reduce((groups, meal) => {
    const dateKey = formatDate(meal.timestamp)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(meal)
    return groups
  }, {} as Record<string, Meal[]>)

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
      </header>

      <div className="page-content">
        {meals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No meals logged yet</h2>
            <p>Start tracking by adding your first meal</p>
          </div>
        ) : (
          <div className="timeline">
            {Object.entries(groupedMeals).map(([date, dateMeals]) => (
              <div key={date} className="date-group">
                <h2 className="date-header">{date}</h2>
                <div className="meals-list">
                  {dateMeals.map((meal) => (
                    <div key={meal.id} className="meal-card">
                      <div className="meal-header">
                        <span className="meal-time">{formatTime(meal.timestamp)}</span>
                        {meal.mealType && (
                          <span className="meal-type-badge">{meal.mealType}</span>
                        )}
                      </div>
                      <p className="meal-description">{meal.description}</p>
                      {meal.tags && meal.tags.length > 0 && (
                        <div className="meal-tags">
                          {meal.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      {meal.notes && (
                        <p className="meal-notes">{meal.notes}</p>
                      )}
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(meal.id)}
                        aria-label="Delete meal"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
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

        .meals-list {
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

        .delete-button {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: var(--spacing-xs);
          opacity: 0.5;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .delete-button:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .delete-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  )
}
