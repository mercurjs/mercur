import {
  WorkflowResponse,
  createWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"

import { deleteSubscriptionPlansStep } from "../steps/delete-subscription-plans"

export type DeleteSubscriptionPlansWorkflowInput = {
  ids: string[]
}

export const deleteSubscriptionPlansWorkflowId = "delete-subscription-plans"

export const deleteSubscriptionPlansWorkflow = createWorkflow(
  deleteSubscriptionPlansWorkflowId,
  (input: WorkflowData<DeleteSubscriptionPlansWorkflowInput>) => {
    deleteSubscriptionPlansStep(input.ids)

    return new WorkflowResponse(void 0)
  }
)
