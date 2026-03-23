import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateSubscriptionOverrideDTO, MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const createSubscriptionOverridesStepId =
  "create-subscription-overrides-step"

export const createSubscriptionOverridesStep = createStep(
  createSubscriptionOverridesStepId,
  async (input: CreateSubscriptionOverrideDTO[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    const overrides =
      await subscriptionService.createSubscriptionOverrides(input)

    return new StepResponse(
      overrides,
      overrides.map((o) => o.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.deleteSubscriptionOverrides(ids)
  }
)
