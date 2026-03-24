import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
} from "@medusajs/medusa/core-flows"

import { validateNotOwnerStep, updateSellerMembersStep } from "../steps"
import { SellerMemberWorkflowEvents } from "../../events"

export const updateMemberRoleWorkflowId = "update-member-role"

type UpdateMemberRoleWorkflowInput = {
  seller_member_id: string
  role_id: string
}

export const updateMemberRoleWorkflow = createWorkflow(
  updateMemberRoleWorkflowId,
  function (input: UpdateMemberRoleWorkflowInput) {
    validateNotOwnerStep(input.seller_member_id)

    const updateInput = transform(
      { input },
      ({ input }) => ({
        selector: { id: input.seller_member_id },
        update: { role_id: input.role_id },
      })
    )

    updateSellerMembersStep(updateInput)

    emitEventStep({
      eventName: SellerMemberWorkflowEvents.UPDATED,
      data: { seller_member_id: input.seller_member_id },
    })

    return new WorkflowResponse(void 0)
  }
)
