import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import CommissionModuleService from '../../../modules/commission/service'
import {
  CommissionRuleDTO,
  UpdateCommissionRuleDTO
} from '../../../modules/commission/types'

export const updateCommissionRuleStep = createStep(
  'update-commission-rule',
  async (input: UpdateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const previousData: CommissionRuleDTO =
      await service.retrieveCommissionRule(input.id)

    const updatedCommissionRule = await service.updateCommissionRules(input)

    return new StepResponse(updatedCommissionRule, previousData)
  },
  async (previousData: CommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.updateCommissionRules(previousData)
  }
)
