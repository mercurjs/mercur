import { WorkflowResponse, createWorkflow } from "@medusajs/framework/workflows-sdk"
import { CreateOnboardingDTO } from "@mercurjs/types"

import { createOnboardingStep } from "../steps"

export const createOnboardingWorkflow = createWorkflow(
  "create-onboarding",
  function (input: CreateOnboardingDTO) {
    const onboarding = createOnboardingStep(input)

    return new WorkflowResponse(onboarding)
  }
)
