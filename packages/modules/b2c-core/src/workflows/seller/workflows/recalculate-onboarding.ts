import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { recalculateOnboardingStep } from '../steps'

export const recalculateOnboardingWorkflow = createWorkflow(
  'recalculate-onboarding',
  function (seller_id: string) {
    return new WorkflowResponse(recalculateOnboardingStep(seller_id))
  }
)
