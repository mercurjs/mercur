import {
  createHook,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { UpdateProfessionalDetailsDTO } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { updateSellerProfessionalDetailsStep } from "../steps/update-seller-professional-details"

export const updateSellerProfessionalDetailsWorkflowId =
  "update-seller-professional-details"

type UpdateSellerProfessionalDetailsWorkflowInput = {
  seller_id: string
  data: UpdateProfessionalDetailsDTO
} & AdditionalData

export const updateSellerProfessionalDetailsWorkflow = createWorkflow(
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
