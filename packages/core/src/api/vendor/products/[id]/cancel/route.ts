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
 * Ownership is keyed off `product_change.created_by` — only the seller who
 * opened the change can cancel it, regardless of who owns the underlying
 * master product. Sellers without a pending change on this product get
 * 404 (nothing to cancel).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCancelProductChangeType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["id"],
    filters: {
      product_id: productId,
      created_by: sellerId,
      status: ProductChangeStatus.PENDING,
    },
  })

  const pendingChange = changes[0]

  if (!pendingChange) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No pending product change to cancel for product '${productId}'`
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
