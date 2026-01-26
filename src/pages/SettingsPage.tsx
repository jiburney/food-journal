/**
 * SettingsPage Component
 *
 * This page will provide access to:
 * - Data export (CSV/JSON) - Phase 7
 * - Clear all data functionality
 * - App information (version, storage usage)
 * - Notification settings (Phase 7 - deferred)
 * - Theme preferences (optional)
 *
 * For now, shows a placeholder with the planned features.
 */

export default function SettingsPage() {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <div className="page-content">
        <div className="settings-section">
          <h2 className="section-title">App Information</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Version</span>
              <span className="info-value">0.1.0 (MVP)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Database</span>
              <span className="info-value">IndexedDB (local)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">✓ Phase 0-1 Complete</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Coming Soon</h2>
          <div className="feature-list">
            <div className="feature-item">📊 Export data (CSV/JSON)</div>
            <div className="feature-item">🗑️ Clear all data</div>
            <div className="feature-item">💾 Storage usage stats</div>
            <div className="feature-item">🔔 Meal reminders (Phase 7)</div>
          </div>
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

        .settings-section {
          margin-bottom: var(--spacing-xl);
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-md) 0;
        }

        .info-card {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          color: var(--color-text);
          font-weight: 500;
        }

        .info-value {
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .feature-item {
          padding: var(--spacing-md);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          font-size: 14px;
          color: var(--color-text);
        }
      `}</style>
    </div>
  )
}
