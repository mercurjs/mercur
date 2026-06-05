import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CreateSubscriptionPlanDTO, MercurModules } from "@mercurjs/types"

import SubscriptionModuleService from "../../../modules/subscription/service"

export const createSubscriptionPlansStepId = "create-subscription-plans-step"

export const createSubscriptionPlansStep = createStep(
  createSubscriptionPlansStepId,
  async (input: CreateSubscriptionPlanDTO[], { container }) => {
    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    const plans = await subscriptionService.createSubscriptionPlans(input)

    return new StepResponse(
      plans,
      plans.map((p) => p.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) return

    const subscriptionService =
      container.resolve<SubscriptionModuleService>(MercurModules.SUBSCRIPTION)

    await subscriptionService.deleteSubscriptionPlans(ids)
  }
)
