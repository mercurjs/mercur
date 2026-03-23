import {
  createHook,
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import SellerModuleService from "../../../modules/seller/service"

const updatePaymentDetailsStep = createStep(
  "update-payment-details",
  async (
    { seller_id, data }: { seller_id: string; data: any },
    { container }
  ) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const [seller] = await service.listSellers(
      { id: seller_id },
      { relations: ["payment_details"] }
    )

    if (seller.payment_details) {
      const updated = await service.updatePaymentDetails(
        {
          id: seller.payment_details.id,
          ...data
        }
      )
      return new StepResponse(updated)
    }

    const created = await service.createPaymentDetails({
      ...data,
      seller_id,
    })
    return new StepResponse(created)
  }
)

export const updateSellerPaymentDetailsWorkflowId = "update-seller-payment-details"

type UpdateSellerPaymentDetailsWorkflowInput = {
  seller_id: string
  data: any
} & AdditionalData

export const updateSellerPaymentDetailsWorkflow = createWorkflow(
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
