import {
  createHook,
  createWorkflow,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { SellerAddressDTO, UpdateSellerAddressDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updateSellerAddressStep } from "../steps/update-seller-address"

export const updateSellerAddressWorkflowId = "update-seller-address"

export type UpdateSellerAddressWorkflowInput = {
  seller_id: string
  data: UpdateSellerAddressDTO
} & AdditionalData

export type UpdateSellerAddressWorkflowHooks = [
  Hook<
    "addressUpdated",
    {
      address: SellerAddressDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateSellerAddressWorkflow: ReturnWorkflow<
  UpdateSellerAddressWorkflowInput,
  SellerAddressDTO,
  UpdateSellerAddressWorkflowHooks
> = createWorkflow(
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
