/**
 * Parses Medusa error messages to extract variant IDs
 * Example: "Variants with IDs variant_01ABC, variant_02DEF do not have a price"
 * Returns: ["variant_01ABC", "variant_02DEF"]
 */
export function parseVariantIdsFromError(errorMessage: string): string[] {
  if (!errorMessage) {
    return []
  }

  const variantIdPattern = /variant_[A-Z0-9]+/g
  const matches = errorMessage.match(variantIdPattern)

  return matches || []
}

