/**
 * BottomNav Component - Mobile-First Navigation
 *
 * This is the main navigation component for the app. It uses a bottom tab bar
 * pattern which is standard for mobile apps and easy to reach with thumbs.
 *
 * Design decisions:
 * - Fixed position at bottom for easy thumb access on mobile
 * - Active state shows with primary color (green) background
 * - Inactive buttons are gray for clear visual hierarchy
 * - Safe area padding for iOS devices with notches/home indicators
 *
 * Accessibility:
 * - Semantic button elements for screen readers
 * - Clear active/inactive states
 * - Descriptive labels (not just icons)
 */

import type { NavPage } from '../../types'

interface BottomNavProps {
  /** Currently active page */
  active: NavPage
  /** Callback when user navigates to a different page */
  onNavigate: (page: NavPage) => void
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-button ${active === 'timeline' ? 'active' : ''}`}
        onClick={() => onNavigate('timeline')}
        aria-current={active === 'timeline' ? 'page' : undefined}
      >
        <span className="nav-icon">📋</span>
        <span className="nav-label">Timeline</span>
      </button>

      <button
        className={`nav-button ${active === 'add-meal' ? 'active' : ''}`}
        onClick={() => onNavigate('add-meal')}
        aria-current={active === 'add-meal' ? 'page' : undefined}
      >
        <span className="nav-icon">🍽️</span>
        <span className="nav-label">Add Meal</span>
      </button>

      <button
        className={`nav-button ${active === 'settings' ? 'active' : ''}`}
        onClick={() => onNavigate('settings')}
        aria-current={active === 'settings' ? 'page' : undefined}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">Settings</span>
      </button>

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          /* Add padding for iOS safe area (notch/home indicator) */
          padding-bottom: max(var(--spacing-sm), env(safe-area-inset-bottom));
          background-color: var(--color-bg);
          border-top: 1px solid var(--color-border);
          /* Elevate above content */
          box-shadow: var(--shadow-md);
          z-index: 1000;
        }

        .nav-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--color-text-secondary);
          min-width: 80px;
        }

        .nav-button:hover {
          background-color: var(--color-bg-secondary);
        }

        .nav-button.active {
          background-color: var(--color-primary);
          color: white;
        }

        .nav-button:active {
          transform: scale(0.95);
        }

        .nav-icon {
          font-size: 24px;
          line-height: 1;
        }

        .nav-label {
          font-size: 12px;
          font-weight: 500;
          line-height: 1;
        }

        /* Desktop: Center the navigation and limit width */
        @media (min-width: 1024px) {
          .bottom-nav {
            max-width: 800px;
            left: 50%;
            transform: translateX(-50%);
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }
        }
      `}</style>
    </nav>
  )
}
