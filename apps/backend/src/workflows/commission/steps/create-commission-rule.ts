import { Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '@mercurjs/commission'
import { CommissionModuleService } from '@mercurjs/commission'
import { CommissionRuleDTO, CreateCommissionRuleDTO } from '@mercurjs/framework'

export const createCommissionRuleStep = createStep(
  'create-commission-rule',
  async (input: CreateCommissionRuleDTO, { container }) => {
    const pricingService = container.resolve(Modules.PRICING)
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const price_set_id = input.rate.price_set
      ? (
          await pricingService.createPriceSets({
            prices: input.rate.price_set
          })
        ).id
      : null

    const min_price_set_id = input.rate.min_price_set
      ? (
          await pricingService.createPriceSets({
            prices: input.rate.min_price_set
          })
        ).id
      : null

    const max_price_set_id = input.rate.max_price_set
      ? (
          await pricingService.createPriceSets({
            prices: input.rate.max_price_set
          })
        ).id
      : null

    const commission_rate = await service.createCommissionRates({
      ...input.rate,
      max_price_set_id,
      min_price_set_id,
      price_set_id
    })

    const commissionRule: CommissionRuleDTO =
      await service.createCommissionRules({
        ...input,
        rate: commission_rate.id
      })

    return new StepResponse(commissionRule, commissionRule.id)
  },
  async (commissionRuleId: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.deleteCommissionRules([commissionRuleId])
  }
)
