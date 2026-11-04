import { orderExchangeRequestItemReturnWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"

import { validateSellerStockLocations } from "../../../../stock-locations/helpers"
import { VendorPostExchangesReturnRequestItemsReqType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostExchangesReturnRequestItemsReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  await validateSellerStockLocations(
    req.scope,
    req.seller_context!.seller_id,
    req.validatedBody.location_id ? [req.validatedBody.location_id] : []
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    filters: { id },
    fields: ["id", "return_id"],
  })

  const { result } = await orderExchangeRequestItemReturnWorkflow(
    req.scope
  ).run({
    input: {
      ...req.validatedBody,
      return_id: exchange.return_id,
      exchange_id: id,
    },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
