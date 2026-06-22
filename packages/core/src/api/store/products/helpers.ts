/**
 * Splits the virtual offer-pricing fields (`variants.calculated_price[.*]`,
 * `variants.offer_id`) out of a store-product field set. They are computed
 * post-query from the cheapest offer, not graph columns, so passing them to
 * `query.graph` raises `Trying to query by not existing property`.
 */
export const splitComputedVariantFields = (fields: string[]) => {
  const withCalculatedPrice = fields.some(
    (f) =>
      f === "variants.calculated_price" ||
      f.startsWith("variants.calculated_price.") ||
      f === "variants.offer_id"
  )

  const filteredFields = fields.filter(
    (f) =>
      f !== "variants.calculated_price" &&
      !f.startsWith("variants.calculated_price.") &&
      f !== "variants.offer_id"
  )

  return { fields: filteredFields, withCalculatedPrice }
}
