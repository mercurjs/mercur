import { beginOrderEditOrderWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostOrderEditsReqType } from "./validators"

/**
 * `POST /vendor/order-edits` — mirrors `POST /admin/order-edits`
 * (medusa/packages/medusa/src/api/admin/order-edits/route.ts). Begins
 * a new order edit draft on the seller-owned parent order.
 * Seller-scope is enforced by `assertSellerOwnsOrder` middleware.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditResponse>
) => {
  const input = req.validatedBody as VendorPostOrderEditsReqType

  const { result } = await beginOrderEditOrderWorkflow(req.scope).run({
    input,
  })

  res.json({
    order_change: result as unknown as HttpTypes.AdminOrderChange,
  })
}
