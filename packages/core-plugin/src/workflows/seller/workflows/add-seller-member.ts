import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
} from "@medusajs/medusa/core-flows"

import { createSellerMembersStep } from "../steps"
import { SellerMemberWorkflowEvents } from "../../events"

export const addSellerMemberWorkflowId = "add-seller-member"

type AddSellerMemberWorkflowInput = {
  seller_id: string
  member_id: string
  role_id: string
}

export const addSellerMemberWorkflow = createWorkflow(
  addSellerMemberWorkflowId,
  function (input: AddSellerMemberWorkflowInput) {
    const sellerMembers = createSellerMembersStep(
      transform(
        { input },
        ({ input }) => [{
          seller_id: input.seller_id,
          member_id: input.member_id,
          role_id: input.role_id,
        }]
      )
    )

    const sellerMember = transform(
      { sellerMembers },
      ({ sellerMembers }) => sellerMembers[0]
    )

    emitEventStep({
      eventName: SellerMemberWorkflowEvents.CREATED,
      data: {
        seller_id: input.seller_id,
        member_id: input.member_id,
      },
    })

    return new WorkflowResponse(sellerMember)
  }
)
