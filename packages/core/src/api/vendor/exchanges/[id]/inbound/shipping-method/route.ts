import { createExchangeShippingMethodWorkflow } from "@medusajs/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"

import { VendorPostExchangesShippingReqType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostExchangesShippingReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    filters: { id },
    fields: ["id", "return_id"],
  })

  const { result } = await createExchangeShippingMethodWorkflow(req.scope).run({
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
