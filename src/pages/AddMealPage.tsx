/**
 * AddMealPage Component
 *
 * This is where users log their meals. It supports text input with:
 * - Description textarea (autofocused for speed)
 * - Tag selector (predefined + custom tags)
 * - Optional notes field
 * - Save/Cancel buttons
 *
 * Design goals:
 * - Fast entry (< 10 seconds to log a meal)
 * - Clear visual hierarchy
 * - Immediate feedback on save
 * - Auto-navigation to timeline after save
 *
 * User flow:
 * 1. User types meal description (or uses voice in Phase 4)
 * 2. Selects relevant tags
 * 3. Optionally adds notes
 * 4. Clicks Save
 * 5. Meal persists to IndexedDB
 * 6. Form clears
 * 7. (Future) Auto-navigate to timeline
 *
 * Note: Voice input will be added in Phase 4
 */

import { useState, useRef, useEffect } from 'react'
import { addMeal } from '../services/db'
import TagSelector from '../components/meal/TagSelector'
import VoiceInput from '../components/meal/VoiceInput'
import { MEAL_TYPES, type MealType } from '../types'
import { guessMealType } from '../utils/mealUtils'
import { isSpeechRecognitionSupported } from '../services/speech'

interface AddMealPageProps {
  /** Callback to navigate back to timeline after save */
  onNavigateToTimeline?: () => void
}

export default function AddMealPage({ onNavigateToTimeline }: AddMealPageProps) {
  // Form state
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState<MealType | undefined>(() => guessMealType())
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showNotes, setShowNotes] = useState(false)

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')

  // Ref for autofocus
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Check if voice is supported
  const voiceSupported = isSpeechRecognitionSupported()

  /**
   * Autofocus the description field when page loads
   * This speeds up data entry - user can immediately start typing
   */
  useEffect(() => {
    descriptionRef.current?.focus()
  }, [])

  /**
   * Save the meal to IndexedDB
   */
  const handleSave = async () => {
    // Validation
    if (!description.trim()) {
      alert('Please enter a meal description')
      return
    }

    setIsSaving(true)

    try {
      // Save to IndexedDB
      await addMeal({
        timestamp: Date.now(),
        type: 'text', // Will be 'voice' when using voice input (Phase 4)
        mealType,
        description: description.trim(),
        notes: notes.trim() || undefined,
        tags,
      })

      // Show success feedback
      setSaveSuccess(true)

      // Clear form after a brief delay
      setTimeout(() => {
        setDescription('')
        setMealType(guessMealType()) // Reset to guessed meal type
        setNotes('')
        setTags([])
        setShowNotes(false)
        setSaveSuccess(false)

        // Focus back on description for quick consecutive entries
        descriptionRef.current?.focus()

        // Navigate to timeline if callback provided
        // (Will be added when we integrate with App.tsx navigation)
        onNavigateToTimeline?.()
      }, 500)
    } catch (error) {
      console.error('Failed to save meal:', error)
      alert('Failed to save meal. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Cancel and clear the form
   */
  const handleCancel = () => {
    if (description || notes || tags.length > 0) {
      const confirmed = confirm('Discard this meal entry?')
      if (!confirmed) return
    }

    setDescription('')
    setMealType(guessMealType()) // Reset to guessed meal type
    setNotes('')
    setTags([])
    setShowNotes(false)
    descriptionRef.current?.focus()
  }

  /**
   * Handle Enter key in description (Shift+Enter for new line)
   */
  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Cmd/Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  /**
   * Handle voice transcript
   * Appends new text to description as user speaks
   */
  const handleVoiceTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      // Final result - append to description with space
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript)
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Log Meal</h1>
        {saveSuccess && (
          <div className="save-success">✓ Saved!</div>
        )}
      </header>

      <div className="page-content">
        <form
          className="meal-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          {/* Description field */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              What did you eat? <span className="required">*</span>
            </label>

            {/* Mode toggle - only show if voice is supported */}
            {voiceSupported && (
              <div className="input-mode-toggle">
                <button
                  type="button"
                  className={`mode-button ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={() => setInputMode('text')}
                >
                  ⌨️ Type
                </button>
                <button
                  type="button"
                  className={`mode-button ${inputMode === 'voice' ? 'active' : ''}`}
                  onClick={() => setInputMode('voice')}
                >
                  🎤 Voice
                </button>
              </div>
            )}

            {/* Text input mode */}
            {inputMode === 'text' && (
              <>
                <textarea
                  id="description"
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  placeholder="e.g., Chicken sandwich with lettuce and tomato"
                  className="description-input"
                  rows={2}
                  required
                />
                <p className="field-hint">
                  Tip: Press Cmd/Ctrl+Enter to save quickly
                </p>
              </>
            )}

            {/* Voice input mode */}
            {inputMode === 'voice' && (
              <div className="voice-input-container">
                <VoiceInput onTranscript={handleVoiceTranscript} />
                {description && (
                  <div className="voice-transcript">
                    <p className="transcript-label">Transcript:</p>
                    <p className="transcript-text">{description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Fallback message for unsupported browsers */}
            {!voiceSupported && (
              <div className="voice-unsupported">
                <p>Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.</p>
              </div>
            )}
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

          {/* Action buttons - moved here to stay above the fold */}
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
              {isSaving ? 'Saving...' : 'Save Meal'}
            </button>
          </div>

          {/* Tag selector - moved below buttons, optional section */}
          <TagSelector selectedTags={tags} onTagsChange={setTags} />

          {/* Optional notes field */}
          {!showNotes && (
            <button
              type="button"
              className="add-notes-button"
              onClick={() => setShowNotes(true)}
            >
              + Add notes
            </button>
          )}

          {showNotes && (
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., At Italian restaurant, felt rushed"
                className="notes-input"
                rows={2}
              />
            </div>
          )}
        </form>
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
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .save-success {
          color: var(--color-primary);
          font-size: 14px;
          font-weight: 600;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .meal-form {
          max-width: 600px;
          margin: 0 auto;
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
          font-size: 16px;
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

        .description-input::placeholder,
        .notes-input::placeholder {
          color: var(--color-text-secondary);
        }

        .field-hint {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: var(--spacing-xs) 0 0 0;
          display: none; /* Hide on mobile to save space */
        }

        @media (min-width: 640px) {
          .field-hint {
            display: block; /* Show on tablet+ */
          }
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

        .add-notes-button {
          padding: var(--spacing-sm) var(--spacing-md);
          background: none;
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: var(--spacing-lg);
        }

        .add-notes-button:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
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
          background-color: var(--color-primary);
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background-color: var(--color-primary-dark);
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

        .input-mode-toggle {
          display: flex;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .mode-button {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg);
          color: var(--color-text);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-button:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        .mode-button.active {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .voice-input-container {
          margin-top: var(--spacing-sm);
        }

        .voice-transcript {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .transcript-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .transcript-text {
          font-size: 14px;
          color: var(--color-text);
          margin: 0;
          line-height: 1.5;
        }

        .voice-unsupported {
          padding: var(--spacing-md);
          background-color: var(--color-danger-light);
          border: 1px solid var(--color-danger);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-sm);
        }

        .voice-unsupported p {
          margin: 0;
          font-size: 13px;
          color: var(--color-danger-dark);
        }
      `}</style>
    </div>
  )
}
