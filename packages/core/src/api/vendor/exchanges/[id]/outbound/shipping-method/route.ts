import { createExchangeShippingMethodWorkflow } from "@medusajs/core-flows"
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

  const { result } = await createExchangeShippingMethodWorkflow(req.scope).run({
    input: { ...req.validatedBody, exchange_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
