import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ProductChangeDTO, ProductChangeStatus } from "@mercurjs/types"

import { cancelProductEditWorkflow } from "../../../../../workflows/product-edit/workflows/cancel-product-edit"
import { VendorCancelProductChangeType } from "../../validators"

/**
 * Vendor-side cancel of the active pending `ProductChange` for a product.
 * Mirrors the admin cancel route but keys off `product_id` so the seller
 * does not need to know the change id. Validates seller ownership via the
 * `product_seller` link before delegating to `cancelProductEditWorkflow`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCancelProductChangeType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: ownership } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: sellerId, product_id: productId },
  })

  if (!ownership.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["id"],
    filters: {
      product_id: productId,
      status: ProductChangeStatus.PENDING,
    },
  })

  const pendingChange = changes[0]

  if (!pendingChange) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product '${productId}' has no pending change`
    )
  }

  await cancelProductEditWorkflow(req.scope).run({
    input: {
      product_change_id: pendingChange.id,
      actor_id: sellerId,
      internal_note: req.validatedBody?.internal_note,
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: pendingChange.id },
  })

  res.json({ product_change })
}
