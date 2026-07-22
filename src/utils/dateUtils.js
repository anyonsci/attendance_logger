/**
 * Returns a local-date YYYY-MM-DD string for the given date (defaults to today).
 * Uses local date parts to avoid UTC timezone shifting.
 */
export function formatDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Returns a local-date YYYY-MM string for the given date (defaults to today).
 * Uses local date parts to avoid UTC timezone shifting.
 */
export function formatMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
