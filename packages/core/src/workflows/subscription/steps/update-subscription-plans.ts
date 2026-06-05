import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { UpdateSubscriptionPlanDTO, MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const updateSubscriptionPlansStepId = "update-subscription-plans-step"

export const updateSubscriptionPlansStep = createStep(
  updateSubscriptionPlansStepId,
  async (input: UpdateSubscriptionPlanDTO[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    const plans = await subscriptionService.updateSubscriptionPlans(input)

    return new StepResponse(plans, input)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.updateSubscriptionPlans(prevData)
  }
)
