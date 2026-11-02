import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { CreateOnboardingDTO } from "@mercurjs/types"

import { createOnboardingStep } from "../steps"

export const createOnboardingWorkflowId = "create-onboarding-workflow"

/**
 * Publishes the seller's next link: onboarding until their details are
 * submitted, the provider dashboard login afterwards.
 */
export const createOnboardingWorkflow = createWorkflow(
  createOnboardingWorkflowId,
  function (input: CreateOnboardingDTO) {
    const onboarding = createOnboardingStep(input)

    return new WorkflowResponse(onboarding)
  }
)
