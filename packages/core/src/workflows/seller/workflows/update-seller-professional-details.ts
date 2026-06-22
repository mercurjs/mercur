import {
  createHook,
  createWorkflow,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  ProfessionalDetailsDTO,
  UpdateProfessionalDetailsDTO,
} from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updateSellerProfessionalDetailsStep } from "../steps/update-seller-professional-details"

export const updateSellerProfessionalDetailsWorkflowId =
  "update-seller-professional-details"

export type UpdateSellerProfessionalDetailsWorkflowInput = {
  seller_id: string
  data: UpdateProfessionalDetailsDTO
} & AdditionalData

export type UpdateSellerProfessionalDetailsWorkflowHooks = [
  Hook<
    "professionalDetailsUpdated",
    {
      professional_details: ProfessionalDetailsDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateSellerProfessionalDetailsWorkflow: ReturnWorkflow<
  UpdateSellerProfessionalDetailsWorkflowInput,
  ProfessionalDetailsDTO,
  UpdateSellerProfessionalDetailsWorkflowHooks
> = createWorkflow(
  updateSellerProfessionalDetailsWorkflowId,
  function (input: UpdateSellerProfessionalDetailsWorkflowInput) {
    const professionalDetails = updateSellerProfessionalDetailsStep(input)

    const professionalDetailsUpdated = createHook(
      "professionalDetailsUpdated",
      {
        professional_details: professionalDetails,
        additional_data: input.additional_data,
      }
    )

    return new WorkflowResponse(professionalDetails, {
      hooks: [professionalDetailsUpdated],
    })
  }
)
