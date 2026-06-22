import { orderEditUpdateItemQuantityWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { VendorPostOrderEditsUpdateItemQuantityReqType } from "../../../../validators"

/**
 * `POST /vendor/order-edits/:id/items/item/:item_id` — mirrors
 * `POST /admin/order-edits/:id/items/item/:item_id`. Updates the
 * quantity (and optional price overrides) on an existing line item
 * inside the order-edit draft.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsUpdateItemQuantityReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id, item_id } = req.params

  const { result } = await orderEditUpdateItemQuantityWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      order_id: id,
      items: [
        {
          ...req.validatedBody,
          id: item_id,
        },
      ],
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
