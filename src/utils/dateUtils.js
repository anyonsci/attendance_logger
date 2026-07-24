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

/**
 * Checks if two Date objects refer to the same year, month, and date.
 */
export function sameDate(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

/**
 * Returns an array of 7 Date objects representing the current calendar week (Sunday to Saturday)
 * containing the reference date (defaults to today).
 */
export function getCurrentWeekDays(refDate = new Date()) {
  const dayOfWeek = refDate.getDay() // 0 = Sun, 6 = Sat
  const sunday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - dayOfWeek)
  
  return Array.from({ length: 7 }, (_, i) => {
    return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i)
  })
}
