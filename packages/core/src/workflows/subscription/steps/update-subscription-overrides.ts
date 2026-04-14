import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateSubscriptionOverrideDTO, MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const updateSubscriptionOverridesStepId =
  "update-subscription-overrides-step"

export const updateSubscriptionOverridesStep = createStep(
  updateSubscriptionOverridesStepId,
  async (input: UpdateSubscriptionOverrideDTO[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    const overrides =
      await subscriptionService.updateSubscriptionOverrides(input)

    return new StepResponse(overrides, input)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.updateSubscriptionOverrides(prevData)
  }
)
