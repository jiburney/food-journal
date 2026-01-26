/**
 * TagSelector Component
 *
 * Allows users to quickly select predefined food tags and add custom tags.
 *
 * Design pattern:
 * - Predefined tags as clickable chips (toggle on/off)
 * - Active tags get green background for clear visual feedback
 * - Custom tag input for one-off additions (e.g., "custom: aioli")
 * - Tags prefixed with "custom: " to distinguish from predefined
 *
 * UX goals:
 * - Fast selection (single tap to toggle)
 * - Clear visual distinction between selected/unselected
 * - Easy to add restaurant-specific or uncommon foods
 *
 * Why tags matter for Alpha Gal:
 * - Red meat (beef/lamb, pork) is the primary trigger
 * - Dairy can also cause issues
 * - Mayo-based sauces often contain mammal products
 * - Need to track these consistently for pattern analysis
 */

import { useState } from 'react'
import { PREDEFINED_TAGS } from '../../types'

interface TagSelectorProps {
  /** Currently selected tags */
  selectedTags: string[]
  /** Callback when tags change */
  onTagsChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  // Local state for custom tag input
  const [customTagInput, setCustomTagInput] = useState('')

  /**
   * Toggle a predefined tag on/off
   */
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      // Add tag
      onTagsChange([...selectedTags, tag])
    }
  }

  /**
   * Add a custom tag
   * Validates and prefixes with "custom: " to distinguish from predefined tags
   */
  const addCustomTag = () => {
    const trimmed = customTagInput.trim()

    // Validation
    if (!trimmed) return // Empty input
    if (PREDEFINED_TAGS.includes(trimmed as any)) {
      // User typed a predefined tag - just toggle it instead
      toggleTag(trimmed)
      setCustomTagInput('')
      return
    }

    // Create custom tag with prefix
    const customTag = `custom: ${trimmed}`

    // Don't add duplicates
    if (selectedTags.includes(customTag)) {
      setCustomTagInput('')
      return
    }

    // Add the custom tag
    onTagsChange([...selectedTags, customTag])
    setCustomTagInput('')
  }

  /**
   * Handle Enter key in custom tag input
   */
  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  /**
   * Remove a tag (used for custom tags with × button)
   */
  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag))
  }

  // Separate custom tags from predefined tags
  const customTags = selectedTags.filter((tag) => tag.startsWith('custom: '))

  return (
    <div className="tag-selector">
      <label className="tag-label">Tags (optional)</label>
      <p className="tag-description">
        Select common ingredients or add custom tags
      </p>

      {/* Predefined tags */}
      <div className="tag-grid">
        {PREDEFINED_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              className={`tag-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Selected custom tags */}
      {customTags.length > 0 && (
        <div className="custom-tags">
          <p className="custom-tags-label">Custom tags:</p>
          <div className="tag-list">
            {customTags.map((tag) => (
              <div key={tag} className="custom-tag-chip">
                <span>{tag.replace('custom: ', '')}</span>
                <button
                  type="button"
                  className="remove-tag"
                  onClick={() => removeTag(tag)}
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom tag input */}
      <div className="custom-tag-input">
        <input
          type="text"
          value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          onKeyDown={handleCustomTagKeyDown}
          placeholder="Add custom tag (e.g., aioli, sushi)"
          className="tag-input"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="add-tag-button"
          disabled={!customTagInput.trim()}
        >
          + Add
        </button>
      </div>

      <style>{`
        .tag-selector {
          margin-bottom: var(--spacing-md);
        }

        .tag-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: var(--spacing-xs);
        }

        .tag-description {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
          gap: 6px;
          margin-bottom: var(--spacing-sm);
        }

        .tag-chip {
          padding: 6px 10px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg);
          color: var(--color-text);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .tag-chip:hover {
          border-color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        .tag-chip.selected {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .tag-chip:active {
          transform: scale(0.95);
        }

        .custom-tags {
          margin-bottom: var(--spacing-md);
        }

        .custom-tags-label {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .custom-tag-chip {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background-color: var(--color-primary-light);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--color-primary-dark);
        }

        .remove-tag {
          background: none;
          border: none;
          color: var(--color-primary-dark);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-tag:hover {
          color: var(--color-danger);
        }

        .custom-tag-input {
          display: flex;
          gap: var(--spacing-sm);
        }

        .tag-input {
          flex: 1;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-family: inherit;
          color: var(--color-text);
        }

        .tag-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .tag-input::placeholder {
          color: var(--color-text-secondary);
        }

        .add-tag-button {
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .add-tag-button:hover:not(:disabled) {
          background-color: var(--color-primary-dark);
        }

        .add-tag-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .add-tag-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
