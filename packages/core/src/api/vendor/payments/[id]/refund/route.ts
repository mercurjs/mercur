import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@mercurjs/types"

import { refundSplitOrderPaymentWorkflow } from "../../../../../workflows/payment"
import { refetchPayment, validateSellerPayment } from "../../helpers"
import { VendorCreatePaymentRefundType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreatePaymentRefundType>,
  res: MedusaResponse<HttpTypes.VendorPaymentResponse>
) => {
  const sellerId = req.seller_context!.seller_id
  const { id } = req.params

  const orderId = await validateSellerPayment(req.scope, sellerId, id)

  await refundSplitOrderPaymentWorkflow(req.scope).run({
    input: {
      payment_id: id,
      order_id: orderId,
      created_by: sellerId,
      ...req.validatedBody,
    },
  })

  const payment = await refetchPayment(req.scope, id, req.queryConfig.fields)

  res.status(200).json({ payment })
}
