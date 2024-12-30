import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import ComissionModuleService from '../../../modules/comission/service'

export const deleteComissionRateStep = createStep(
  'delete-comission-rate',
  async (id: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.softDeleteComissionRates(id)

    return new StepResponse(id)
  },
  async (id: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.restoreComissionRates(id)
  }
)
