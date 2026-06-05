import {
  createHook,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { UpdatePaymentDetailsDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updatePaymentDetailsStep } from "../steps/update-payment-details"

export const updateSellerPaymentDetailsWorkflowId =
  "update-seller-payment-details"

type UpdateSellerPaymentDetailsWorkflowInput = {
  seller_id: string
  data: UpdatePaymentDetailsDTO
} & AdditionalData

export const updateSellerPaymentDetailsWorkflow: ReturnType<typeof createWorkflow> = createWorkflow(
  updateSellerPaymentDetailsWorkflowId,
  function (input: UpdateSellerPaymentDetailsWorkflowInput) {
    const paymentDetails = updatePaymentDetailsStep(input)

    const paymentDetailsUpdated = createHook("paymentDetailsUpdated", {
      payment_details: paymentDetails,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(paymentDetails, {
      hooks: [paymentDetailsUpdated],
    })
  }
)
