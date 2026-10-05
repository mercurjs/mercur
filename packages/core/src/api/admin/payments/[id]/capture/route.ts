import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { refetchPayment } from "@medusajs/medusa/api/admin/payments/helpers"
import { AdminCreatePaymentCaptureType } from "@medusajs/medusa/api/admin/payments/validators"

import { captureSplitOrderPaymentWorkflow } from "../../../../../workflows/payment"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePaymentCaptureType>,
  res: MedusaResponse<HttpTypes.AdminPaymentResponse>
) => {
  const { id } = req.params

  await captureSplitOrderPaymentWorkflow(req.scope).run({
    input: {
      payment_id: id,
      captured_by: req.auth_context.actor_id,
      amount: req.validatedBody.amount,
    },
  })

  const payment = await refetchPayment(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ payment })
}
