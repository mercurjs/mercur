import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { CreateSellerDTO } from "@mercurjs/types"

import { createSellerStep } from "../steps"

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  auth_identity_id: string
}

export const createSellerWorkflow = createWorkflow(
  "create-seller",
  function (input: CreateSellerWorkflowInput) {
    const seller = createSellerStep(input.seller)

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "seller",
      value: seller.id,
    })

    return new WorkflowResponse(seller)
  }
)
