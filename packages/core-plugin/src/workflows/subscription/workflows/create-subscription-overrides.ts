import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { CreateSubscriptionOverrideDTO } from "@mercurjs/types"

import { createSubscriptionOverridesStep } from "../steps/create-subscription-overrides"

export const createSubscriptionOverridesWorkflowId =
  "create-subscription-overrides"

export const createSubscriptionOverridesWorkflow = createWorkflow(
  createSubscriptionOverridesWorkflowId,
  function (input: CreateSubscriptionOverrideDTO[]) {
    const overrides = createSubscriptionOverridesStep(input)

    return new WorkflowResponse(overrides)
  }
)
