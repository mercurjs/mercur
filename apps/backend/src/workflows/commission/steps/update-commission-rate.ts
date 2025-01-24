import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMMISSION_MODULE } from '../../../modules/commission'
import CommissionModuleService from '../../../modules/commission/service'
import {
  CommissionRateDTO,
  UpdateCommissionRateDTO
} from '../../../modules/commission/types'

export const updateComissionRateStep = createStep(
  'update-comission-rate',
  async (input: UpdateCommissionRateDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    const previousData: CommissionRateDTO =
      await service.retrieveCommissionRate(input.id)

    const updatedCommissionRate = await service.updateCommissionRates(input)

    return new StepResponse(updatedCommissionRate, previousData)
  },
  async (previousData: CommissionRateDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE)

    await service.updateCommissionRates(previousData)
  }
)
