import {
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { CreateSubscriptionPlanDTO } from "@mercurjs/types"

import { createSubscriptionPlansStep } from "../steps/create-subscription-plans"

export const createSubscriptionPlansWorkflowId = "create-subscription-plans"

export const createSubscriptionPlansWorkflow = createWorkflow(
  createSubscriptionPlansWorkflowId,
  function (input: CreateSubscriptionPlanDTO[]) {
    const plans = createSubscriptionPlansStep(input)

    return new WorkflowResponse(plans)
  }
)
