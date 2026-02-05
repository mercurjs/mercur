/**
 * Pick properties from an object and copy them to a new object
 * @param obj
 * @param keys
 */
export function pick(obj: Record<string, any>, keys: string[]) {
  const ret: Record<string, any> = {}

  keys.forEach((k) => {
    if (k in obj) {
      ret[k] = obj[k]
    }
  })

  return ret
}

/**
 * Remove properties that are `null` or `undefined` from the object.
 * @param obj
 */
export function cleanNonValues(obj: Record<string, any>) {
  const ret: Record<string, any> = {}

  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] !== "undefined") {
      ret[key] = obj[key]
    }
  }

  return ret
}

/**
 * Convert a string to camel case
 * @param str
 * @returns camel case string
 */
export function toCamelCase(str: string): string {
  return /^([a-zA-Z]+)(([A-Z]([a-z]+))+)$/.test(str)
    ? str
    : str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
}
