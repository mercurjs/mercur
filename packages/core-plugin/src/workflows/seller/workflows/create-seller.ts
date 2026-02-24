import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  Hook
} from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { CreateSellerDTO, SellerDTO } from "@mercurjs/types"

import { createSellerStep } from "../steps"

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  auth_identity_id: string
}

export const createSellerWorkflow = createWorkflow<CreateSellerWorkflowInput, SellerDTO, [Hook<"sellerCreated", { seller: SellerDTO }, unknown>]>(
  "create-seller",
  function (input: CreateSellerWorkflowInput) {
    const seller = createSellerStep(input.seller)

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "seller",
      value: seller.id,
    })

    const sellerCreated = createHook("sellerCreated", {
      seller,
    })

    return new WorkflowResponse(seller, {
      hooks: [sellerCreated],
    })
  }
)
