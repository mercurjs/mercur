import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { productEditRemoveAttributeWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-remove-attribute"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const attributeId = req.params.attribute_id

  const {
    data: [product_attribute],
  } = await query.graph({
    entity: "product_attribute",
    fields: req.queryConfig.fields,
    filters: { id: attributeId, product_id: req.params.id },
  })

  if (!product_attribute) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product attribute with id ${attributeId} was not found for product ${req.params.id}`
    )
  }

  res.json({ product_attribute })
}

/**
 * Stages an `ATTRIBUTE_REMOVE` action via `product-edit-remove-attribute`.
 * Returns the created `ProductChange` — the attribute is unlinked from
 * the product only after an operator confirms the change.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { result: change } = await productEditRemoveAttributeWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      attribute_id: req.params.attribute_id,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}
