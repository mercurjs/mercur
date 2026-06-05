import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const deleteSubscriptionOverridesStepId =
  "delete-subscription-overrides-step"

export const deleteSubscriptionOverridesStep = createStep(
  deleteSubscriptionOverridesStepId,
  async (ids: string[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.softDeleteSubscriptionOverrides(ids)

    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.restoreSubscriptionOverrides(ids)
  }
)
