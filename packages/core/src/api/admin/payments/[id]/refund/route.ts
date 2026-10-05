import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { refetchPayment } from "@medusajs/medusa/api/admin/payments/helpers"

import { refundSplitOrderPaymentWorkflow } from "../../../../../workflows/payment"
import { AdminCreatePaymentRefundType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreatePaymentRefundType>,
  res: MedusaResponse<HttpTypes.AdminPaymentResponse>
) => {
  const { id } = req.params

  await refundSplitOrderPaymentWorkflow(req.scope).run({
    input: {
      payment_id: id,
      created_by: req.auth_context.actor_id,
      ...req.validatedBody,
    },
  })

  const payment = await refetchPayment(id, req.scope, req.queryConfig.fields)

  res.status(200).json({ payment })
}
