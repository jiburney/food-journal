/**
 * MealEditor Component
 *
 * Modal overlay for editing existing meals.
 *
 * How it works:
 * 1. User clicks edit button (✏️) on a meal card in Timeline
 * 2. Modal opens with form pre-populated with existing meal data
 * 3. User can modify any field (date, time, meal type, description, tags, notes)
 * 4. Save button updates the meal in IndexedDB
 * 5. Delete button removes the meal after confirmation
 *
 * Design notes:
 * - Reuses TagSelector component from add meal form for consistency
 * - NO auto-fill logic when meal type changes (only in add mode)
 * - All fields pre-populated from existing meal
 * - Date cannot be in the future
 */

import { useState, useEffect } from 'react'
import { updateMeal, deleteMeal } from '../../services/db'
import type { Meal, MealType } from '../../types'
import TagSelector from './TagSelector'
import { MEAL_TYPES } from '../../types'
import { format } from 'date-fns'

interface MealEditorProps {
  /** The meal being edited (null when modal is closed) */
  meal: Meal | null
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback after meal is successfully saved or deleted */
  onSaved?: () => void
}

export default function MealEditor({ meal, isOpen, onClose, onSaved }: MealEditorProps) {
  // Form state
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState<MealType | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mealDate, setMealDate] = useState('')
  const [mealTime, setMealTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Get today's date in YYYY-MM-DD format for max date validation
  const todayString = new Date().toISOString().split('T')[0]

  // Populate form when meal changes
  useEffect(() => {
    if (meal && isOpen) {
      setDescription(meal.description)
      setMealType(meal.mealType)
      setNotes(meal.notes || '')
      setTags(meal.tags || [])

      // Convert timestamp to date and time
      const mealDateTime = new Date(meal.timestamp)
      setMealDate(format(mealDateTime, 'yyyy-MM-dd'))
      setMealTime(format(mealDateTime, 'HH:mm'))
    }
  }, [meal, isOpen])

  /**
   * Save the updated meal to IndexedDB
   */
  const handleSave = async () => {
    // Validation
    if (!description.trim()) {
      alert('Please enter a meal description')
      return
    }

    if (!meal) return

    setIsSaving(true)

    try {
      // Combine date and time to create timestamp
      const timestamp = new Date(`${mealDate}T${mealTime}`).getTime()

      // Update the meal in IndexedDB
      await updateMeal({
        ...meal,
        timestamp,
        mealType,
        description: description.trim(),
        notes: notes.trim() || undefined,
        tags,
      })

      // Notify parent and close
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Failed to update meal:', error)
      alert('Failed to update meal. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Delete the meal from IndexedDB
   */
  const handleDelete = async () => {
    if (!meal) return

    const confirmed = confirm(
      'Are you sure you want to delete this meal? This action cannot be undone.'
    )
    if (!confirmed) return

    setIsSaving(true)

    try {
      await deleteMeal(meal.id)

      // Notify parent and close
      onSaved?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete meal:', error)
      alert('Failed to delete meal. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handle Cancel - confirm if user has made changes
   */
  const handleCancel = () => {
    // Simple check: if description is different from original, confirm
    if (meal && description !== meal.description) {
      const confirmed = confirm('Discard changes to this meal?')
      if (!confirmed) return
    }

    onClose()
  }

  // Don't render if not open or no meal
  if (!isOpen || !meal) return null

  return (
    <>
      {/* Modal backdrop */}
      <div className="modal-backdrop" onClick={handleCancel} />

      {/* Modal content */}
      <div className="modal-content">
        <div className="modal-header">
          <h2>✏️ Edit Meal</h2>
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
            <label htmlFor="edit-description" className="form-label">
              What did you eat? <span className="required">*</span>
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Chicken sandwich with lettuce and tomato"
              className="description-input"
              rows={2}
              required
              autoFocus
            />
          </div>

          {/* Date and Time pickers */}
          <div className="form-group">
            <label className="form-label">Date & Time</label>
            <div className="datetime-grid">
              <div className="date-field">
                <label htmlFor="edit-meal-date" className="field-sublabel">Date</label>
                <input
                  type="date"
                  id="edit-meal-date"
                  value={mealDate}
                  max={todayString}
                  onChange={(e) => setMealDate(e.target.value)}
                  className="datetime-input"
                />
              </div>
              <div className="time-field">
                <label htmlFor="edit-meal-time" className="field-sublabel">Time</label>
                <input
                  type="time"
                  id="edit-meal-time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="datetime-input"
                />
              </div>
            </div>
          </div>

          {/* Meal type selector */}
          <div className="form-group">
            <label className="form-label">Meal Type (optional)</label>
            <div className="meal-type-grid">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`meal-type-button ${mealType === type ? 'selected' : ''}`}
                  onClick={() => setMealType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tag selector - reuse from add meal form */}
          <TagSelector selectedTags={tags} onTagsChange={setTags} />

          {/* Optional notes field */}
          <div className="form-group">
            <label htmlFor="edit-notes" className="form-label">
              Notes (optional)
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., At Italian restaurant, felt rushed"
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
              type="button"
              onClick={handleDelete}
              className="delete-button"
              disabled={isSaving}
            >
              Delete
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={!description.trim() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
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
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .datetime-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .date-field,
        .time-field {
          display: flex;
          flex-direction: column;
        }

        .field-sublabel {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }

        .datetime-input {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 15px;
          font-family: inherit;
          color: var(--color-text);
        }

        .datetime-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .meal-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-xs);
        }

        .meal-type-button {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg);
          color: var(--color-text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: capitalize;
        }

        .meal-type-button:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        .meal-type-button.selected {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .meal-type-button:active {
          transform: scale(0.95);
        }

        /* Action buttons */
        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-lg);
        }

        .cancel-button,
        .delete-button,
        .save-button {
          padding: var(--spacing-md) var(--spacing-lg);
          border: none;
          border-radius: var(--radius-md);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button {
          flex: 1;
          background-color: var(--color-bg-secondary);
          color: var(--color-text);
          border: 1px solid var(--color-border);
        }

        .cancel-button:hover:not(:disabled) {
          background-color: var(--color-border);
        }

        .delete-button {
          flex: 1;
          background-color: var(--color-danger);
          color: white;
        }

        .delete-button:hover:not(:disabled) {
          background-color: var(--color-danger-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .save-button {
          flex: 1;
          background-color: var(--color-primary);
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background-color: var(--color-primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .save-button:active:not(:disabled),
        .delete-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .save-button:disabled,
        .delete-button:disabled,
        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
