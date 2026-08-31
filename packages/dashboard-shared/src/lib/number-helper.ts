/**
 * Gets the number of decimal places in a number
 * @param num - The number for which we are getting the number of decimal places
 * @returns The number of decimal places
 *
 * @example
 * getDecimalPlaces(123.456) // 3
 * getDecimalPlaces(42) // 0
 * getDecimalPlaces(10.0000) // 0
 */
export function getNumberOfDecimalPlaces(num: number): number {
  // Convert to string and check if it contains a decimal point
  const str = num.toString()
  if (str.indexOf(".") === -1) {
    return 0
  }
  // Return the length of the part after the decimal point
  return str.split(".")[1].length
}
