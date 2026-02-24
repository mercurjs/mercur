import {
  createHook,
  Hook,
  ReturnWorkflow,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { CreateSellerDTO, SellerDTO } from "@mercurjs/types"

import { createSellerStep } from "../steps"

type CreateSellerWorkflowInput = {
  seller: CreateSellerDTO
  auth_identity_id: string
}

export const createSellerWorkflow: ReturnWorkflow<CreateSellerWorkflowInput, SellerDTO, [Hook<"sellerCreated", { seller: SellerDTO, auth_identity_id: string }, unknown>]> = createWorkflow(
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
      auth_identity_id: input.auth_identity_id,
    })

    return new WorkflowResponse(seller, {
      hooks: [sellerCreated],
    })
  }
)
