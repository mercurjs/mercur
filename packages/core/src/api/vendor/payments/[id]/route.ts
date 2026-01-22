import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { refetchPayment, validateSellerPayment } from "../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPaymentResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerPayment(req.scope, sellerId, req.params.id)

  const payment = await refetchPayment(
    req.scope,
    req.params.id,
    req.queryConfig.fields
  )

  res.status(200).json({ payment })
}
