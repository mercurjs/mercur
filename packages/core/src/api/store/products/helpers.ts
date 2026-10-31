import { MedusaStoreRequest } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

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

// Routes nested under a product re-apply the published filter that
// `/store/products/:id` applies through its own matcher.
export const validateProductVisibility = async (
  req: MedusaStoreRequest<unknown>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { id: req.params.id, status: ProductStatus.PUBLISHED },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${req.params.id} was not found`
    )
  }
}
