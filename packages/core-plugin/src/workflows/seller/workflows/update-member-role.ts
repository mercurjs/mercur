import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { validateNotOwnerStep, updateSellerMembersStep } from "../steps"
import { SellerMemberWorkflowEvents } from "../../events"

export const updateMemberRoleWorkflowId = "update-member-role"

type UpdateMemberRoleWorkflowInput = {
  seller_member_id: string
  role_handle: string
}

export const updateMemberRoleWorkflow = createWorkflow(
  updateMemberRoleWorkflowId,
  function (input: UpdateMemberRoleWorkflowInput) {
    validateNotOwnerStep(input.seller_member_id)

    const { data: role } = useQueryGraphStep({
      entity: "rbac_role",
      fields: ["id"],
      filters: { handle: input.role_handle },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-role" })

    const updateInput = transform(
      { input, role },
      ({ input, role }) => ({
        selector: { id: input.seller_member_id },
        update: { role_id: role[0].id },
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
