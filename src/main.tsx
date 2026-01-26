/**
 * Application Entry Point
 *
 * This is the first file that runs when the app loads.
 * It renders the root React component (App) into the HTML.
 *
 * React's StrictMode:
 * - Helps identify potential problems in development
 * - Runs effects twice to catch bugs
 * - Only active in development, not production
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Get the root element from index.html
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create React root and render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
