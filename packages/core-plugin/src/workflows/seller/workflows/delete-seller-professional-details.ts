import {
  createHook,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"

import { deleteSellerProfessionalDetailsStep } from "../steps/delete-seller-professional-details"

export const deleteSellerProfessionalDetailsWorkflowId =
  "delete-seller-professional-details"

type DeleteSellerProfessionalDetailsWorkflowInput = {
  seller_id: string
} & AdditionalData

export const deleteSellerProfessionalDetailsWorkflow = createWorkflow(
  deleteSellerProfessionalDetailsWorkflowId,
  function (input: DeleteSellerProfessionalDetailsWorkflowInput) {
    deleteSellerProfessionalDetailsStep({ seller_id: input.seller_id })

    const professionalDetailsDeleted = createHook(
      "professionalDetailsDeleted",
      {
        seller_id: input.seller_id,
        additional_data: input.additional_data,
      }
    )

    return new WorkflowResponse(void 0, {
      hooks: [professionalDetailsDeleted],
    })
  }
)
