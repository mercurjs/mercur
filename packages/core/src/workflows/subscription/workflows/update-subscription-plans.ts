import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { UpdateSubscriptionPlanDTO } from "@mercurjs/types"

import { updateSubscriptionPlansStep } from "../steps/update-subscription-plans"

export const updateSubscriptionPlansWorkflowId = "update-subscription-plans"

export const updateSubscriptionPlansWorkflow = createWorkflow(
  updateSubscriptionPlansWorkflowId,
  function (input: UpdateSubscriptionPlanDTO[]) {
    const plans = updateSubscriptionPlansStep(input)

    return new WorkflowResponse(plans)
  }
)
