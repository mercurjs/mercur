import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { cancelOrderFulfillmentWorkflow } from "../../../../../../../workflows/order/workflows/cancel-order-fulfillment"
import { validateSellerOrder } from "../../../../helpers"
import { VendorCancelFulfillmentType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCancelFulfillmentType>,
  res: MedusaResponse<HttpTypes.VendorOrderResponse>
) => {
  const { id, fulfillment_id } = req.params
  const sellerId = req.seller_context!.seller_id

  await validateSellerOrder(req.scope, sellerId, id)

  const { additional_data, no_notification } = req.validatedBody

  await cancelOrderFulfillmentWorkflow(req.scope).run({
    input: {
      order_id: id,
      fulfillment_id,
      canceled_by: sellerId,
      no_notification,
      additional_data,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: req.queryConfig.fields,
    filters: { id },
  })

  res.json({ order })
}
