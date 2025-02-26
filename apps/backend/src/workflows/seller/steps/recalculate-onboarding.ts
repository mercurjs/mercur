import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createStep } from '@medusajs/framework/workflows-sdk'

export const recalculateOnboardingStep = createStep(
  'recalculate-onboarding',
  async (seller_id: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    /* Store information */
  }
)
