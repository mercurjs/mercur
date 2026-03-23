import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { createSellerMembersStep } from "../steps"
import { SellerMemberWorkflowEvents } from "../../events"

export const addSellerMemberWorkflowId = "add-seller-member"

type AddSellerMemberWorkflowInput = {
  seller_id: string
  member_id: string
  role_handle: string
}

export const addSellerMemberWorkflow = createWorkflow(
  addSellerMemberWorkflowId,
  function (input: AddSellerMemberWorkflowInput) {
    const { data: role } = useQueryGraphStep({
      entity: "rbac_role",
      fields: ["id"],
      filters: { handle: input.role_handle },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-role" })

    const sellerMembers = createSellerMembersStep(
      transform(
        { input, role },
        ({ input, role }) => [{
          seller_id: input.seller_id,
          member_id: input.member_id,
          role_id: role[0].id,
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
