/**
 * Type Definitions for Food Journal App
 *
 * This file contains all the TypeScript interfaces that define the shape of our data.
 * TypeScript helps catch bugs at compile-time by ensuring we use the correct data types.
 *
 * Why TypeScript over JavaScript?
 * - Catches typos and type errors before runtime
 * - Better autocomplete in your editor
 * - Self-documenting code (types show what data looks like)
 * - Refactoring is safer (compiler tells you what breaks)
 */

/**
 * Meal Interface
 *
 * Represents a single meal entry in the food journal.
 * Each meal is stored in IndexedDB and can be exported for analysis.
 */
export interface Meal {
  /** Unique identifier - generated using crypto.randomUUID() */
  id: string;

  /** Unix timestamp in milliseconds (Date.now()) - when the meal was consumed */
  timestamp: number;

  /** How the meal was logged - helps identify data quality */
  type: 'text' | 'voice';

  /** Type of meal - helps with pattern analysis by time of day */
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  /** Natural language description of what was eaten */
  description: string;

  /** Optional additional context (e.g., "At Italian restaurant", "Felt rushed") */
  notes?: string;

  /**
   * Array of tags for filtering and analysis
   * Examples: ["dairy", "gluten", "custom: aioli"]
   * Custom tags are prefixed with "custom: " to distinguish from predefined tags
   */
  tags: string[];
}

/**
 * Flareup Interface
 *
 * Represents a digestive symptom event.
 * Automatically associates with the last 6 meals for pattern analysis.
 */
export interface Flareup {
  /** Unique identifier */
  id: string;

  /** Unix timestamp in milliseconds - when symptoms occurred */
  timestamp: number;

  /** Description of symptoms (e.g., "Sharp abdominal pain", "Nausea") */
  description: string;

  /** Symptom severity - used for color-coding in UI */
  severity: 'mild' | 'moderate' | 'severe';

  /**
   * IDs of meals eaten before this flare-up
   * Automatically populated with last 6 meals when flare-up is logged
   * Used for correlation analysis
   */
  associatedMealIds: string[];

  /** Optional additional notes about the symptoms */
  notes?: string;
}

/**
 * Settings Interface
 *
 * App-wide settings stored in IndexedDB.
 * Note: Notification settings are defined but not implemented in Phase 1 MVP.
 */
export interface Settings {
  /** Notification settings (deferred to Phase 7) */
  notifications: {
    enabled: boolean;
    permission: NotificationPermission;  // Browser notification permission state
    times: NotificationTime[];
  };

  /** Export tracking */
  export: {
    lastExportDate: number;  // Unix timestamp of last export
  };

  /** Theme preference (optional for Phase 1) */
  theme?: 'light' | 'dark' | 'auto';

  /** Custom tags that user has previously used (for auto-suggestions) */
  customTags?: string[];
}

/**
 * NotificationTime Interface
 *
 * Represents a scheduled meal reminder notification.
 * (Deferred to Phase 7 - not implemented in MVP)
 */
export interface NotificationTime {
  /** Unique identifier for this notification */
  id: string;

  /** Display label (e.g., "Breakfast", "Lunch", "Dinner") */
  label: string;

  /** Time in 24-hour format (e.g., "08:00", "12:30") */
  time: string;

  /** Whether this notification is active */
  enabled: boolean;
}

/**
 * Predefined Tags
 *
 * These are the quick-select tags shown in the meal logging UI.
 * Users can also add custom tags which are prefixed with "custom: "
 */
export const PREDEFINED_TAGS = [
  // Primary allergens and triggers
  'dairy',
  'gluten',
  'spicy',
  'alcohol',

  // Meat types (Alpha Gal specific)
  'poultry',       // chicken, turkey
  'beef/lamb',     // red meat - key trigger for Alpha Gal
  'pork',          // red meat - key trigger for Alpha Gal
  'fish',
  'shellfish',

  // Preparation methods
  'mayo-based',    // mayonnaise-based sauces/dressings
  'fried',
  'oily',          // dishes with noticeable oil content
] as const;

/**
 * Type alias for predefined tags
 * This creates a union type of all tag strings for type safety
 */
export type PredefinedTag = typeof PREDEFINED_TAGS[number];

/**
 * Meal Types
 *
 * Categories for meals to help with pattern analysis.
 * Useful for identifying if certain meal types correlate with symptoms.
 */
export const MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const;

export type MealType = typeof MEAL_TYPES[number];

/**
 * Navigation types for the bottom navigation bar
 */
export type NavPage = 'timeline' | 'add-meal' | 'settings';
