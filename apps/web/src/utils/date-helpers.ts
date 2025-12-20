/**
 * Get the start of today (00:00:00)
 * @returns Date object set to start of today
 */
export function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get the start of tomorrow (00:00:00)
 * @returns Date object set to start of tomorrow
 */
export function getStartOfTomorrow(): Date {
  const today = getStartOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

/**
 * Get the start of the current month
 * @returns Date object set to start of current month
 */
export function getStartOfMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of the current month
 * @returns Date object set to end of current month
 */
export function getEndOfMonth(): Date {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get a date N months ago
 * @param monthsAgo - Number of months to go back
 * @returns Date object set to N months ago
 */
export function getMonthsAgo(monthsAgo: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
}

/**
 * Get a date N days ago
 * @param daysAgo - Number of days to go back
 * @returns Date object set to N days ago
 */
export function getDaysAgo(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Get a date N weeks ago
 * @param weeksAgo - Number of weeks to go back
 * @returns Date object set to N weeks ago
 */
export function getWeeksAgo(weeksAgo: number): Date {
  return getDaysAgo(weeksAgo * 7);
}
