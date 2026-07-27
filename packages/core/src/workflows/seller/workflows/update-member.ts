import {
  createHook,
  createWorkflow,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { AdditionalData } from "@medusajs/framework/types"
import { MemberDTO } from "@mercurjs/types"

import { updateMembersStep } from "../steps"

export const updateMemberWorkflowId = "update-member"

export type UpdateMemberWorkflowInput = {
  selector: Record<string, unknown>
  update: {
    first_name?: string | null
    last_name?: string | null
    locale?: string | null
  }
} & AdditionalData

export type UpdateMemberWorkflowHooks = [
  Hook<
    "membersUpdated",
    {
      members: MemberDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateMemberWorkflow: ReturnWorkflow<
  UpdateMemberWorkflowInput,
  MemberDTO[],
  UpdateMemberWorkflowHooks
> = createWorkflow(
  updateMemberWorkflowId,
  function (input: UpdateMemberWorkflowInput) {
    const members = updateMembersStep(input)

    const membersUpdated = createHook("membersUpdated", {
      members,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(members, { hooks: [membersUpdated] })
  }
)
