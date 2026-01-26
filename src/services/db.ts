/**
 * IndexedDB Database Layer
 *
 * This file handles all interactions with the browser's IndexedDB storage.
 *
 * ## What is IndexedDB?
 * IndexedDB is a low-level API for client-side storage of significant amounts of
 * structured data. Unlike localStorage (which only stores strings up to ~5MB),
 * IndexedDB can store:
 * - Complex JavaScript objects
 * - Large amounts of data (50-100MB+ on mobile, unlimited on desktop)
 * - Blobs (files, images) - we'll use this in Phase 6 for photos
 *
 * ## Why IndexedDB over localStorage?
 * - Can store complex objects without JSON.stringify/parse
 * - Much larger storage capacity
 * - Supports indexes for fast queries
 * - Asynchronous (doesn't block UI)
 * - Supports transactions (all-or-nothing operations)
 *
 * ## Why use the 'idb' library?
 * The native IndexedDB API is callback-based and verbose. The 'idb' library
 * (by Jake Archibald from Google) wraps it with Promises, making it work
 * cleanly with async/await.
 *
 * ## Database Schema:
 * - meals: stores Meal objects, indexed by timestamp for timeline queries
 * - flareups: stores Flareup objects, indexed by timestamp
 * - settings: stores Settings object (single key-value store)
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { Meal, Flareup, Settings } from '../types'

// Database configuration
const DB_NAME = 'food-journal-db'
const DB_VERSION = 1

// Object store names
const STORES = {
  MEALS: 'meals',
  FLAREUPS: 'flareups',
  SETTINGS: 'settings',
} as const

/**
 * Interface for our database structure
 * This tells TypeScript what object stores exist and their types
 */
interface FoodJournalDB {
  meals: {
    key: string // Meal ID
    value: Meal // Full Meal object
    indexes: {
      timestamp: number // Index for sorting by time
    }
  }
  flareups: {
    key: string // Flareup ID
    value: Flareup // Full Flareup object
    indexes: {
      timestamp: number // Index for sorting by time
    }
  }
  settings: {
    key: string // Setting key (e.g., 'app-settings')
    value: Settings // Settings object
  }
}

/**
 * Initialize and open the database
 *
 * This function:
 * 1. Opens the database (creates it if it doesn't exist)
 * 2. Sets up object stores and indexes if this is the first run
 * 3. Handles version upgrades (when DB_VERSION changes)
 *
 * IndexedDB uses a "version" system for schema migrations. When you increment
 * DB_VERSION, the upgrade callback runs, allowing you to add new stores or indexes.
 *
 * @returns Promise that resolves to the database instance
 */
async function initDB(): Promise<IDBPDatabase<FoodJournalDB>> {
  return openDB<FoodJournalDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // This callback runs when the database is first created or when
      // DB_VERSION is incremented. It's where we define our schema.

      // Create meals object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.MEALS)) {
        const mealStore = db.createObjectStore(STORES.MEALS, {
          keyPath: 'id', // Use the 'id' field as the primary key
        })

        // Create an index on timestamp for efficient timeline queries
        // This allows us to quickly get meals in chronological order
        mealStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Create flareups object store
      if (!db.objectStoreNames.contains(STORES.FLAREUPS)) {
        const flareupStore = db.createObjectStore(STORES.FLAREUPS, {
          keyPath: 'id',
        })

        flareupStore.createIndex('timestamp', 'timestamp', { unique: false })
      }

      // Create settings object store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        // Settings store uses a string key (not an object field)
        db.createObjectStore(STORES.SETTINGS)
      }
    },
  })
}

// ============================================================================
// Meal Operations
// ============================================================================

/**
 * Add a new meal to the database
 *
 * @param meal - Meal data without an ID (ID is auto-generated)
 * @returns Promise resolving to the new meal's ID
 *
 * Example usage:
 * ```typescript
 * const mealId = await addMeal({
 *   timestamp: Date.now(),
 *   type: 'text',
 *   description: 'Chicken sandwich with mayo',
 *   tags: ['poultry', 'mayo-based'],
 *   notes: 'At local deli'
 * })
 * ```
 */
export async function addMeal(meal: Omit<Meal, 'id'>): Promise<string> {
  const db = await initDB()

  // Generate a unique ID using the browser's built-in crypto API
  // crypto.randomUUID() creates a v4 UUID like: "550e8400-e29b-41d4-a716-446655440000"
  const id = crypto.randomUUID()

  const mealWithId: Meal = {
    ...meal,
    id,
  }

  // Add the meal to the database
  // IndexedDB transactions are automatic - if this fails, nothing is saved
  await db.add(STORES.MEALS, mealWithId)

  return id
}

/**
 * Get all meals from the database
 *
 * Returns meals in reverse chronological order (newest first) for the timeline view.
 *
 * @returns Promise resolving to array of all meals
 */
export async function getMeals(): Promise<Meal[]> {
  const db = await initDB()

  // Get all meals from the store
  const meals = await db.getAll(STORES.MEALS)

  // Sort by timestamp descending (newest first)
  // We do this in memory because IndexedDB indexes are sorted ascending only
  return meals.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get a specific meal by ID
 *
 * @param id - The meal's unique identifier
 * @returns Promise resolving to the meal, or undefined if not found
 */
export async function getMealById(id: string): Promise<Meal | undefined> {
  const db = await initDB()
  return db.get(STORES.MEALS, id)
}

/**
 * Get the last N meals (for flare-up association)
 *
 * When logging a flare-up, we automatically associate it with recent meals.
 * This function retrieves the most recent meals up to the specified limit.
 *
 * Why 6 meals?
 * - Covers approximately 2 days of eating
 * - Alpha Gal reactions can occur 3-6 hours after consumption
 * - Enough context for pattern analysis without overwhelming data
 *
 * @param n - Number of meals to retrieve (default: 6)
 * @returns Promise resolving to array of most recent meals
 */
export async function getLastNMeals(n: number = 6): Promise<Meal[]> {
  const meals = await getMeals()

  // getMeals() already sorts by timestamp desc, so we just take the first N
  return meals.slice(0, n)
}

/**
 * Get meals that occurred before a specific timestamp
 *
 * Used for flare-up association - finds meals eaten before symptoms appeared.
 *
 * @param beforeTime - Unix timestamp (milliseconds since 1970)
 * @param limit - Maximum number of meals to return (default: 6)
 * @returns Promise resolving to array of meals, sorted newest to oldest
 */
export async function getMealsBeforeTimestamp(
  beforeTime: number,
  limit: number = 6
): Promise<Meal[]> {
  const meals = await getMeals()

  // Filter to meals before the timestamp and take the first N
  return meals.filter((meal) => meal.timestamp < beforeTime).slice(0, limit)
}

/**
 * Delete a meal from the database
 *
 * Note: This doesn't remove the meal from flareup associations.
 * The flareup will still reference the meal ID, but getMealById will return undefined.
 * In a future enhancement, we could add cascade deletion or orphan cleanup.
 *
 * @param id - ID of the meal to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteMeal(id: string): Promise<void> {
  const db = await initDB()
  await db.delete(STORES.MEALS, id)
}

// ============================================================================
// Flareup Operations
// ============================================================================

/**
 * Add a new flare-up to the database
 *
 * This automatically associates the flare-up with recent meals.
 * The associatedMealIds will be populated with the last 6 meals before the flare-up.
 *
 * @param flareup - Flare-up data without ID or associated meals
 * @returns Promise resolving to the new flare-up's ID
 *
 * Example usage:
 * ```typescript
 * const flareupId = await addFlareup({
 *   timestamp: Date.now(),
 *   description: 'Sharp abdominal pain, nausea',
 *   severity: 'moderate',
 *   notes: 'Started about 3 hours after dinner'
 * })
 * ```
 */
export async function addFlareup(
  flareup: Omit<Flareup, 'id' | 'associatedMealIds'>
): Promise<string> {
  const db = await initDB()

  // Generate unique ID
  const id = crypto.randomUUID()

  // Automatically associate with recent meals
  // Get meals that occurred before this flare-up
  const recentMeals = await getMealsBeforeTimestamp(flareup.timestamp, 6)
  const associatedMealIds = recentMeals.map((meal) => meal.id)

  const flareupWithId: Flareup = {
    ...flareup,
    id,
    associatedMealIds,
  }

  await db.add(STORES.FLAREUPS, flareupWithId)

  return id
}

/**
 * Get all flare-ups from the database
 *
 * Returns flare-ups in reverse chronological order (newest first).
 *
 * @returns Promise resolving to array of all flare-ups
 */
export async function getFlareups(): Promise<Flareup[]> {
  const db = await initDB()

  const flareups = await db.getAll(STORES.FLAREUPS)

  // Sort by timestamp descending (newest first)
  return flareups.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Get a specific flare-up by ID
 *
 * @param id - The flare-up's unique identifier
 * @returns Promise resolving to the flare-up, or undefined if not found
 */
export async function getFlareupById(id: string): Promise<Flareup | undefined> {
  const db = await initDB()
  return db.get(STORES.FLAREUPS, id)
}

/**
 * Delete a flare-up from the database
 *
 * @param id - ID of the flare-up to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteFlareup(id: string): Promise<void> {
  const db = await initDB()
  await db.delete(STORES.FLAREUPS, id)
}

// ============================================================================
// Settings Operations
// ============================================================================

const SETTINGS_KEY = 'app-settings'

/**
 * Default settings for a new installation
 */
const DEFAULT_SETTINGS: Settings = {
  notifications: {
    enabled: false,
    permission: 'default',
    times: [],
  },
  export: {
    lastExportDate: 0,
  },
  theme: 'auto',
}

/**
 * Get app settings
 *
 * Returns saved settings, or default settings if none exist.
 *
 * @returns Promise resolving to the settings object
 */
export async function getSettings(): Promise<Settings> {
  const db = await initDB()

  const settings = await db.get(STORES.SETTINGS, SETTINGS_KEY)

  // If no settings exist yet, return defaults
  return settings ?? DEFAULT_SETTINGS
}

/**
 * Update app settings
 *
 * Uses a partial update - only the provided fields are changed.
 * This allows updating just the export timestamp without affecting notifications, etc.
 *
 * @param updates - Partial settings object with fields to update
 * @returns Promise that resolves when settings are updated
 *
 * Example usage:
 * ```typescript
 * // Update only the last export date
 * await updateSettings({
 *   export: { lastExportDate: Date.now() }
 * })
 * ```
 */
export async function updateSettings(
  updates: Partial<Settings>
): Promise<void> {
  const db = await initDB()

  // Get current settings
  const current = await getSettings()

  // Merge updates with current settings
  // This performs a shallow merge - for nested objects like 'notifications',
  // you need to provide the entire nested object
  const updated: Settings = {
    ...current,
    ...updates,
  }

  // Save back to database
  await db.put(STORES.SETTINGS, updated, SETTINGS_KEY)
}

/**
 * Clear all data from the database
 *
 * DANGER: This permanently deletes all meals, flare-ups, and settings.
 * Used in the settings page "Clear All Data" feature.
 * User should be prompted for confirmation before calling this.
 *
 * @returns Promise that resolves when all data is cleared
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB()

  // Create a transaction that can write to all stores
  const tx = db.transaction([STORES.MEALS, STORES.FLAREUPS, STORES.SETTINGS], 'readwrite')

  // Clear each object store
  await Promise.all([
    tx.objectStore(STORES.MEALS).clear(),
    tx.objectStore(STORES.FLAREUPS).clear(),
    tx.objectStore(STORES.SETTINGS).clear(),
  ])

  // Wait for the transaction to complete
  await tx.done
}

/**
 * Get database storage usage information
 *
 * Uses the StorageManager API to check how much space is used.
 * Useful for monitoring storage limits on mobile devices.
 *
 * Note: This requires HTTPS and is not supported in all browsers.
 *
 * @returns Promise resolving to storage estimate, or null if not supported
 */
export async function getStorageInfo(): Promise<{
  usage: number
  quota: number
  percentUsed: number
} | null> {
  // Check if StorageManager API is available
  if (!navigator.storage || !navigator.storage.estimate) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()

    if (estimate.usage === undefined || estimate.quota === undefined) {
      return null
    }

    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentUsed: (estimate.usage / estimate.quota) * 100,
    }
  } catch (error) {
    console.error('Failed to get storage info:', error)
    return null
  }
}
