import {
  WorkflowResponse,
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { deleteSubscriptionOverridesStep } from "../steps/delete-subscription-overrides"

export type DeleteSubscriptionOverridesWorkflowInput = {
  ids: string[]
}

export const deleteSubscriptionOverridesWorkflowId =
  "delete-subscription-overrides"

export const deleteSubscriptionOverridesWorkflow = createWorkflow(
  deleteSubscriptionOverridesWorkflowId,
  (input: WorkflowData<DeleteSubscriptionOverridesWorkflowInput>) => {
    deleteSubscriptionOverridesStep(input.ids)

    return new WorkflowResponse(void 0)
  }
)
