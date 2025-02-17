import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import CommissionModuleService from '../../../modules/commission/service'

export const deleteCommissionRuleStep = createStep(
  'delete-commission-rule',
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.softDeleteCommissionRules(id)

    return new StepResponse(id)
  },
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.restoreCommissionRules(id)
  }
)
