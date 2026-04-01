import {
  createHook,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { UpdateSellerAddressDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updateSellerAddressStep } from "../steps/update-seller-address"

export const updateSellerAddressWorkflowId = "update-seller-address"

type UpdateSellerAddressWorkflowInput = {
  seller_id: string
  data: UpdateSellerAddressDTO
} & AdditionalData

export const updateSellerAddressWorkflow: ReturnType<typeof createWorkflow> = createWorkflow(
  updateSellerAddressWorkflowId,
  function (input: UpdateSellerAddressWorkflowInput) {
    const address = updateSellerAddressStep(input)

    const addressUpdated = createHook("addressUpdated", {
      address,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(address, {
      hooks: [addressUpdated],
    })
  }
)
