/**
 * FlareupLogger Component
 *
 * Modal overlay for logging digestive flare-ups/symptoms.
 *
 * How it works:
 * 1. User clicks "Log Flare-up" button in Timeline
 * 2. Modal opens showing form to describe symptoms
 * 3. User selects severity (mild/moderate/severe)
 * 4. Shows last 6-8 meals that might be related
 * 5. On save, creates Flareup record in IndexedDB
 * 6. Auto-associates with recent meals for pattern analysis
 *
 * Why this matters for Alpha Gal:
 * - Reactions typically occur 3-6 hours after eating trigger foods
 * - Need to track which meals preceded symptoms
 * - Severity tracking helps identify worst triggers
 * - Pattern analysis requires consistent symptom logging
 */

import { useState, useEffect } from 'react'
import { addFlareup, getLastNMeals } from '../../services/db'
import type { Meal } from '../../types'
import { format } from 'date-fns'

interface FlareupLoggerProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback after flareup is successfully saved */
  onSaved?: () => void
}

type Severity = 'mild' | 'moderate' | 'severe'

export default function FlareupLogger({ isOpen, onClose, onSaved }: FlareupLoggerProps) {
  // Form state
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<Severity>('moderate')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Recent meals (loaded when modal opens)
  const [recentMeals, setRecentMeals] = useState<Meal[]>([])

  // Load recent meals when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecentMeals()
    }
  }, [isOpen])

  /**
   * Load the last 6-8 meals to show user what they recently ate
   * These will be auto-associated with the flare-up
   */
  const loadRecentMeals = async () => {
    try {
      const meals = await getLastNMeals(8)
      setRecentMeals(meals)
    } catch (error) {
      console.error('Failed to load recent meals:', error)
    }
  }

  /**
   * Save the flare-up to IndexedDB
   * The addFlareup function automatically associates it with recent meals
   */
  const handleSave = async () => {
    // Validation
    if (!description.trim()) {
      alert('Please describe your symptoms')
      return
    }

    setIsSaving(true)

    try {
      // Save to IndexedDB
      // addFlareup automatically associates with last 6 meals
      await addFlareup({
        timestamp: Date.now(),
        description: description.trim(),
        severity,
        notes: notes.trim() || undefined,
      })

      // Reset form
      setDescription('')
      setSeverity('moderate')
      setNotes('')

      // Notify parent
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Failed to save flare-up:', error)
      alert('Failed to save flare-up. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle Cancel - confirm if user has entered data
   */
  const handleCancel = () => {
    if (description || notes) {
      const confirmed = confirm('Discard this flare-up entry?')
      if (!confirmed) return
    }

    setDescription('')
    setSeverity('moderate')
    setNotes('')
    onClose()
  }

  /**
   * Format meal timestamp for display
   */
  const formatMealTime = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, h:mm a')
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <>
      {/* Modal backdrop */}
      <div className="modal-backdrop" onClick={handleCancel} />

      {/* Modal content */}
      <div className="modal-content">
        <div className="modal-header">
          <h2>🔴 Log Flare-up</h2>
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          {/* Description */}
          <div className="form-group">
            <label htmlFor="flareup-description" className="form-label">
              Symptoms <span className="required">*</span>
            </label>
            <textarea
              id="flareup-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Sharp abdominal pain, nausea, bloating"
              className="description-input"
              rows={3}
              required
              autoFocus
            />
          </div>

          {/* Severity selector */}
          <div className="form-group">
            <label className="form-label">Severity <span className="required">*</span></label>
            <div className="severity-grid">
              <button
                type="button"
                className={`severity-button mild ${severity === 'mild' ? 'selected' : ''}`}
                onClick={() => setSeverity('mild')}
              >
                Mild
              </button>
              <button
                type="button"
                className={`severity-button moderate ${severity === 'moderate' ? 'selected' : ''}`}
                onClick={() => setSeverity('moderate')}
              >
                Moderate
              </button>
              <button
                type="button"
                className={`severity-button severe ${severity === 'severe' ? 'selected' : ''}`}
                onClick={() => setSeverity('severe')}
              >
                Severe
              </button>
            </div>
          </div>

          {/* Recent meals preview */}
          {recentMeals.length > 0 && (
            <div className="recent-meals-section">
              <h3 className="section-heading">Recent Meals (will be associated)</h3>
              <div className="recent-meals-list">
                {recentMeals.map((meal) => (
                  <div key={meal.id} className="recent-meal-item">
                    <span className="meal-time">{formatMealTime(meal.timestamp)}</span>
                    <span className="meal-desc">{meal.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional notes */}
          <div className="form-group">
            <label htmlFor="flareup-notes" className="form-label">
              Additional Notes (optional)
            </label>
            <textarea
              id="flareup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Started about 3 hours after dinner"
              className="notes-input"
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={!description.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Flare-up'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* Modal backdrop - dark overlay */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Modal content */
        .modal-content {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-bg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          max-width: 500px;
          width: calc(100% - 32px);
          max-height: 90vh;
          overflow-y: auto;
          z-index: 1001;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        /* Modal header */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 32px;
          line-height: 1;
          color: var(--color-text-secondary);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .close-button:hover {
          color: var(--color-text);
        }

        /* Form inside modal */
        .modal-content form {
          padding: var(--spacing-lg);
        }

        .form-group {
          margin-bottom: var(--spacing-md);
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--spacing-xs);
        }

        .required {
          color: var(--color-danger);
        }

        .description-input,
        .notes-input {
          width: 100%;
          padding: var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 15px;
          font-family: inherit;
          color: var(--color-text);
          resize: vertical;
          line-height: 1.5;
        }

        .description-input:focus,
        .notes-input:focus {
          outline: none;
          border-color: var(--color-danger);
          box-shadow: 0 0 0 3px var(--color-danger-light);
        }

        /* Severity buttons */
        .severity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-sm);
        }

        .severity-button {
          padding: var(--spacing-md);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg);
          color: var(--color-text);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .severity-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .severity-button:active {
          transform: translateY(0);
        }

        /* Severity-specific colors */
        .severity-button.mild {
          border-color: var(--color-severity-mild);
        }

        .severity-button.mild.selected {
          background-color: var(--color-severity-mild);
          border-color: var(--color-severity-mild);
          color: white;
        }

        .severity-button.moderate {
          border-color: var(--color-severity-moderate);
        }

        .severity-button.moderate.selected {
          background-color: var(--color-severity-moderate);
          border-color: var(--color-severity-moderate);
          color: white;
        }

        .severity-button.severe {
          border-color: var(--color-severity-severe);
        }

        .severity-button.severe.selected {
          background-color: var(--color-severity-severe);
          border-color: var(--color-severity-severe);
          color: white;
        }

        /* Recent meals section */
        .recent-meals-section {
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .section-heading {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .recent-meals-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .recent-meal-item {
          display: flex;
          gap: var(--spacing-sm);
          font-size: 13px;
          padding: var(--spacing-xs);
        }

        .meal-time {
          color: var(--color-text-secondary);
          font-weight: 500;
          white-space: nowrap;
          min-width: 90px;
        }

        .meal-desc {
          color: var(--color-text);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Action buttons */
        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
        }

        .cancel-button,
        .save-button {
          flex: 1;
          padding: var(--spacing-md) var(--spacing-lg);
          border: none;
          border-radius: var(--radius-md);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button {
          background-color: var(--color-bg-secondary);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .cancel-button:hover:not(:disabled) {
          background-color: var(--color-border);
        }

        .save-button {
          background-color: var(--color-danger);
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background-color: var(--color-danger-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .save-button:disabled,
        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
