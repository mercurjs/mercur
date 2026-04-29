import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { productEditDeleteProductWorkflow } from "../../../../workflows/product-edit/workflows/product-edit-delete-product"
import { productEditUpdateFieldsWorkflow } from "../../../../workflows/product-edit/workflows/product-edit-update-fields"
import { VendorUpdateProductType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`
    )
  }

  res.json({ product })
}

/**
 * Stages top-level Product field changes through `product-edit-update-fields`.
 * Returns the created `ProductChange` — the product itself is NOT mutated
 * until an operator confirms the change.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const { additional_data: _additional_data, ...updates } = req.validatedBody

  const { result: change } = await productEditUpdateFieldsWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      updates: updates as Record<string, unknown>,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}

/**
 * Stages a `PRODUCT_DELETE` action via `product-edit-delete-product`.
 * Returns the created `ProductChange` — the product is soft-deleted only
 * after an operator confirms the change.
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { result: change } = await productEditDeleteProductWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}
