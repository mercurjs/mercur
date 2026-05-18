import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CreateProductVariantDTO, HttpTypes } from "@mercurjs/types"

import { productEditAddVariantWorkflow } from "../../../../../workflows/product-edit/workflows/product-edit-add-variant"
import { VendorAddProductVariantType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const { data: variants, metadata } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, product_id: productId },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    variants,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

/**
 * Stages a `VARIANT_ADD` action via `product-edit-add-variant`. Returns
 * the created `ProductChange` — the variant is created on the product
 * only after an operator confirms the change.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductVariantType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id

  const { result: change } = await productEditAddVariantWorkflow(
    req.scope
  ).run({
    input: {
      product_id: req.params.id,
      variant: req.validatedBody as unknown as CreateProductVariantDTO,
      actor_id: sellerId,
    },
  })

  res.status(202).json({ product_change: change })
}
