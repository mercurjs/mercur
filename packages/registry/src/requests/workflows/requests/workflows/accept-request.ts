import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { upsertCustomFieldsStep } from "@mercurjs/core-plugin/workflows"

import { RequestStatus } from "../../../types"
import { validateRequestStatusStep } from "../steps"

type AcceptRequestWorkflowInput = {
  alias: string
  entity_id: string
  reviewer_id: string
  reviewer_note?: string
}

export const acceptRequestWorkflow = createWorkflow(
  "accept-request",
  (input: AcceptRequestWorkflowInput) => {
    validateRequestStatusStep({
      alias: input.alias,
      entity_id: input.entity_id,
      expected_status: RequestStatus.PENDING,
    })

    const result = upsertCustomFieldsStep({
      alias: input.alias,
      data: {
        id: input.entity_id,
        request_status: RequestStatus.ACCEPTED,
        reviewer_id: input.reviewer_id,
        reviewer_note: input.reviewer_note ?? null,
      },
    })

    return new WorkflowResponse(result)
  }
)
