import { markPaymentCollectionAsPaid } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  refetchPaymentCollection,
  validateSellerPaymentCollection,
} from "../../helpers"
import { VendorMarkPaymentCollectionAsPaidType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorMarkPaymentCollectionAsPaidType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context!.seller_id
  const { id } = req.params

  const orderId = await validateSellerPaymentCollection(
    req.scope,
    sellerId,
    id
  )

  if (req.validatedBody.order_id !== orderId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `order_id does not match the payment collection's order`
    )
  }

  await markPaymentCollectionAsPaid(req.scope).run({
    input: {
      payment_collection_id: id,
      order_id: orderId,
      captured_by: req.auth_context.actor_id,
    },
  })

  const payment_collection = await refetchPaymentCollection(
    req.scope,
    id,
    req.queryConfig.fields
  )

  res.status(200).json({ payment_collection })
}
