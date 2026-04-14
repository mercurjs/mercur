import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const deleteSubscriptionPlansStepId = "delete-subscription-plans-step"

export const deleteSubscriptionPlansStep = createStep(
  deleteSubscriptionPlansStepId,
  async (ids: string[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.softDeleteSubscriptionPlans(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.restoreSubscriptionPlans(ids)
  }
)
