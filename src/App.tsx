/**
 * App Component - Root of the Application
 *
 * This component manages the app's navigation and layout.
 * We use simple state-based navigation instead of a routing library
 * to keep the MVP lean and avoid unnecessary dependencies.
 *
 * Navigation pattern:
 * - useState tracks which page is active
 * - BottomNav component handles navigation button clicks
 * - Pages render conditionally based on active state
 *
 * Why not use React Router?
 * - This is a single-page PWA that doesn't need URL routing
 * - State-based navigation is simpler and faster
 * - No additional dependencies = smaller bundle size
 * - Better for mobile app-like experience
 */

import { useState } from 'react'
import type { NavPage } from './types'
import BottomNav from './components/layout/BottomNav'
import TimelinePage from './pages/TimelinePage'
import AddMealPage from './pages/AddMealPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  // Track which page is currently active
  // Default to 'add-meal' for quick logging (primary use case)
  const [activePage, setActivePage] = useState<NavPage>('add-meal')

  return (
    <div className="app-container">
      {/* Main content area - pages render here */}
      <main className="main-content">
        {activePage === 'timeline' && <TimelinePage />}
        {activePage === 'add-meal' && <AddMealPage />}
        {activePage === 'settings' && <SettingsPage />}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default App
