import { orderEditAddNewItemWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems } from "../../../orders/resolve-offer-items"
import { VendorPostOrderEditsAddItemsReqType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostOrderEditsAddItemsReqType>,
  res: MedusaResponse<HttpTypes.AdminOrderEditPreviewResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "orders",
    fields: ["id", "currency_code"],
    filters: { id },
  })

  const order = orders?.[0] as { currency_code?: string } | undefined
  if (!order?.currency_code) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order ${id} not found`
    )
  }

  const items = await resolveOfferItems({
    container: req.scope,
    sellerId: req.seller_context!.seller_id,
    currencyCode: order.currency_code,
    items: req.validatedBody.items,
  })

  const { result } = await orderEditAddNewItemWorkflow(req.scope).run({
    input: { items, order_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
