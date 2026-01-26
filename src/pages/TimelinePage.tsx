/**
 * TimelinePage Component
 *
 * This is the main view of the app - shows all meals and flare-ups
 * in reverse chronological order (newest first).
 *
 * Future implementation (Phase 5):
 * - Load meals and flare-ups from IndexedDB
 * - Group by date ("Today", "Yesterday", etc.)
 * - Display MealCard and FlareupCard components
 * - Handle delete operations
 * - Show empty state when no data
 */

export default function TimelinePage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Timeline</h1>
      </header>

      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No meals logged yet</h2>
          <p>Start tracking by adding your first meal</p>
        </div>
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
      `}</style>
    </div>
  )
}
