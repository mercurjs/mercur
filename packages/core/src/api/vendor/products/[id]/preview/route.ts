import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductChangeDTO, ProductChangeStatus } from "@mercurjs/types"

/**
 * Returns the active pending `ProductChange` for a product **scoped to the
 * seller who requested it**. Any vendor can browse the master catalog and
 * may request a change on a product they do not own; only the seller who
 * created the change should see it on preview. If no pending change exists
 * for `(product_id, created_by = current seller)`, the endpoint returns
 * `product_change: null` instead of 404 so the UI can render the master
 * product cleanly.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO | null }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id

  const { data: changes } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: {
      product_id: productId,
      created_by: sellerId,
      status: ProductChangeStatus.PENDING,
    },
  })

  res.json({ product_change: changes[0] ?? null })
}
