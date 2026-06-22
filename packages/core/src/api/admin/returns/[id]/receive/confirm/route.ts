import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { confirmReturnReceiveWorkflow } from "../../../../../../workflows/order/workflows/confirm-return-receive"

/**
 * Mercur override of Medusa's `POST /admin/returns/:id/receive/confirm`.
 * Calls Mercur's `confirmReturnReceiveWorkflow` so the offer-aware
 * `inventory_item_link.required_quantity` restock math fires for bundle
 * offers. The response shape is unchanged so admin UI continues working.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminReturnPreviewResponse>
) => {
  const { id } = req.params

  const { result } = await confirmReturnReceiveWorkflow(req.scope).run({
    input: {
      return_id: id,
      confirmed_by: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: req.queryConfig.fields,
    filters: {
      id,
      ...req.filterableFields,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    return: orderReturn as unknown as HttpTypes.AdminReturn,
  })
}
