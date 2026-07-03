import {
  createHook,
  createWorkflow,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { PaymentDetailsDTO, UpdatePaymentDetailsDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updatePaymentDetailsStep } from "../steps/update-payment-details"

export const updateSellerPaymentDetailsWorkflowId =
  "update-seller-payment-details"

export type UpdateSellerPaymentDetailsWorkflowInput = {
  seller_id: string
  data: UpdatePaymentDetailsDTO
} & AdditionalData

export type UpdateSellerPaymentDetailsWorkflowHooks = [
  Hook<
    "paymentDetailsUpdated",
    {
      payment_details: PaymentDetailsDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateSellerPaymentDetailsWorkflow: ReturnWorkflow<
  UpdateSellerPaymentDetailsWorkflowInput,
  PaymentDetailsDTO,
  UpdateSellerPaymentDetailsWorkflowHooks
> = createWorkflow(
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
