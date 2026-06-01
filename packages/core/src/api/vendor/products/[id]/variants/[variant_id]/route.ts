import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  deleteProductVariantsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { ensureSellerOwnsProduct } from "../../../helpers"
import { VendorUpdateProductVariantType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant],
  } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { id: req.params.variant_id, product_id: req.params.id },
  })

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant with id ${req.params.variant_id} was not found`
    )
  }

  res.json({ variant })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductVariantType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  const { attribute_values: _av, ...update } = req.validatedBody

  await updateProductVariantsWorkflow(req.scope).run({
    input: {
      selector: { id: variantId, product_id: productId } as any,
      update: { ...update, manage_inventory: false } as any,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.json({ product })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  await deleteProductVariantsWorkflow(req.scope).run({
    input: { ids: [variantId] },
  })

  res.json({
    id: variantId,
    object: "variant",
    deleted: true,
  })
}
