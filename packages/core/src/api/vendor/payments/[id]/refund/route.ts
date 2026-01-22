import { refundPaymentWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { refetchPayment, validateSellerPayment } from "../../helpers"
import { VendorCreatePaymentRefundType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePaymentRefundType>,
  res: MedusaResponse<HttpTypes.VendorPaymentResponse>
) => {
  const sellerId = req.auth_context.actor_id
  const { id } = req.params

  await validateSellerPayment(req.scope, sellerId, id)

  await refundPaymentWorkflow(req.scope).run({
    input: {
      payment_id: id,
      created_by: sellerId,
      ...req.validatedBody,
    },
  })

  const payment = await refetchPayment(req.scope, id, req.queryConfig.fields)

  res.status(200).json({ payment })
}
