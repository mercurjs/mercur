import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateVariantsWorkflow } from "../../../../../workflows/product-edit/workflows/product-edit-update-variants"
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
 * Stages a `VARIANT_ADD` action on a fresh `ProductChange`. Auto-
 * confirm applies it inline when the `PRODUCT_REQUEST` feature flag
 * is disabled (the variant is created in the same request via
 * `createProductVariantsWorkflow` invoked by
 * `applyProductChangeActionsWorkflow`).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAddProductVariantType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { attribute_values: _av, ...variant } = req.validatedBody

  const { result } = await productEditUpdateVariantsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [
        {
          type: "add",
          variant: {
            ...(variant as Record<string, unknown>),
            manage_inventory: false,
          },
        },
      ],
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}
