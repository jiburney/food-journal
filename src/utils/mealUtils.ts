/**
 * Meal Utility Functions
 *
 * Helper functions for working with meal data.
 */

import type { MealType } from '../types'

/**
 * Guess the meal type based on the current time of day
 *
 * This provides a smart default to speed up logging - users can override if needed.
 *
 * Time ranges:
 * - Breakfast: 5am - 10:30am
 * - Lunch: 10:30am - 3pm
 * - Dinner: 3pm - 9pm
 * - Snack: 9pm - 5am (late night/early morning)
 *
 * @param date - Optional date to check (defaults to now)
 * @returns Suggested meal type
 */
export function guessMealType(date: Date = new Date()): MealType {
  const hour = date.getHours()

  if (hour >= 5 && hour < 10.5) {
    return 'breakfast'
  } else if (hour >= 10.5 && hour < 15) {
    return 'lunch'
  } else if (hour >= 15 && hour < 21) {
    return 'dinner'
  } else {
    return 'snack'
  }
}
