import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import CommissionModuleService from '../../../modules/commission/service'

export const deleteCommissionRateStep = createStep(
  'delete-commission-rate',
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.softDeleteCommissionRates(id)

    return new StepResponse(id)
  },
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.restoreCommissionRates(id)
  }
)
