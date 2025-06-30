import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '@mercurjs/commission'
import { CommissionModuleService } from '@mercurjs/commission'
import { CommissionRuleDTO, UpdateCommissionRuleDTO } from '@mercurjs/framework'

export const updateCommissionRuleStep = createStep(
  'update-commission-rule',
  async (input: UpdateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const previousData: CommissionRuleDTO =
      await service.retrieveCommissionRule(input.id)

    //@ts-ignore
    const updatedCommissionRule = await service.updateCommissionRules(input)

    return new StepResponse(updatedCommissionRule, previousData)
  },
  async (previousData: CommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    //@ts-ignore
    await service.updateCommissionRules(previousData)
  }
)
