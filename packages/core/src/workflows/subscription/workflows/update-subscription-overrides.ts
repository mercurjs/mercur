import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { UpdateSubscriptionOverrideDTO } from "@mercurjs/types"

import { updateSubscriptionOverridesStep } from "../steps/update-subscription-overrides"

export const updateSubscriptionOverridesWorkflowId =
  "update-subscription-overrides"

export const updateSubscriptionOverridesWorkflow = createWorkflow(
  updateSubscriptionOverridesWorkflowId,
  function (input: UpdateSubscriptionOverrideDTO[]) {
    const overrides = updateSubscriptionOverridesStep(input)

    return new WorkflowResponse(overrides)
  }
)
