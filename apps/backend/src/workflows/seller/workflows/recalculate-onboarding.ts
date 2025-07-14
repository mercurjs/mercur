import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

import { recalculateOnboardingStep } from '../steps'

/**
 * Recalculates seller onboarding progress and returns updated status.
 */
export const recalculateOnboardingWorkflow = createWorkflow(
  'recalculate-onboarding',
  function (seller_id: string) {
    return new WorkflowResponse(recalculateOnboardingStep(seller_id))
  }
)
