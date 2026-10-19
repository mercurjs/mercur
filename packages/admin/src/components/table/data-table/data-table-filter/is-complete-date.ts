const MIN_FULL_YEAR = 1000

/**
 * The date field reports a value as soon as every segment holds a digit, so a
 * year typed as "2", "20", "202" arrives as year 2, 20, 202 before it settles
 * on the intended one. Treat those as still being typed.
 */
export const isCompleteDate = (date: Date | null): date is Date => {
  return !!date && !Number.isNaN(date.getTime()) && date.getFullYear() >= MIN_FULL_YEAR
}
