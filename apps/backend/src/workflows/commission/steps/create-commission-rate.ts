import CommissionModuleService from '#/modules/commission/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import {
  CommissionRateDTO,
  CreateCommissionRateDTO
} from '../../../modules/commission/types'

export const createCommissionRateStep = createStep(
  'create-commission-rate',
  async (input: CreateCommissionRateDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const commissionRate: CommissionRateDTO =
      await service.createCommissionRates(input)

    return new StepResponse(commissionRate, commissionRate.id)
  },
  async (commissionRateId: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.deleteCommissionRates([commissionRateId])
  }
)
