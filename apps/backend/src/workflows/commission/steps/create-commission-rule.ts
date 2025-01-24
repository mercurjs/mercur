import CommissionModuleService from '#/modules/commission/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import {
  CommissionRuleDTO,
  CreateCommissionRuleDTO
} from '../../../modules/commission/types'

export const createCommissionRuleStep = createStep(
  'create-commission-rule',
  async (input: CreateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionRule: CommissionRuleDTO =
      await service.createCommissionRules(input)

    return new StepResponse(commissionRule, commissionRule.id)
  },
  async (commissionRuleId: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.deleteCommissionRules([commissionRuleId])
  }
)
