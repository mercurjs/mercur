const DISALLOWED_KEYS = ["e", "E", "-", "+"]

export function sanitizeNumberInput(
  e: React.KeyboardEvent<HTMLInputElement>,
  disallowedKeys?: string[]
) {
  if (
    [...DISALLOWED_KEYS, ...(disallowedKeys || [])].some((key) => key === e.key)
  ) {
    e.preventDefault()
  }
}
