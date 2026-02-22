import {
  CampaignBudgetUsageContext,
  IPromotionModuleService,
  UsageComputedActions
} from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type RegisterUsageStepInput = {
  computedActions: UsageComputedActions[]
  registrationContext: CampaignBudgetUsageContext
}

export const registerUsageStepId = 'register-promo-usage'
export const registerUsageStep = createStep(
  registerUsageStepId,
  async (data: RegisterUsageStepInput, { container }) => {
    if (!data.computedActions.length) {
      return new StepResponse(null, {computedActions: [], registrationContext: data.registrationContext})
    }

    const promotionModule = container.resolve<IPromotionModuleService>(
      Modules.PROMOTION
    )

    await promotionModule.registerUsage(data.computedActions, data.registrationContext)

    return new StepResponse(null, data)
  },
  async (revertData: RegisterUsageStepInput, { container }) => {
    if (!revertData?.computedActions.length) {
      return
    }

    const promotionModule = container.resolve<IPromotionModuleService>(
      Modules.PROMOTION
    )

    await promotionModule.revertUsage(revertData.computedActions, revertData.registrationContext)
  }
)
