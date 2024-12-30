import ComissionModuleService from 'src/modules/comission/service'

import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import {
  ComissionRateDTO,
  CreateComissionRateDTO
} from '../../../modules/comission/types'

export const createComissionRateStep = createStep(
  'create-comission-rate',
  async (input: CreateComissionRateDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const comissionRate: ComissionRateDTO =
      await service.createComissionRates(input)

    return new StepResponse(comissionRate, comissionRate.id)
  },
  async (comissionRateId: string, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.deleteComissionRates([comissionRateId])
  }
)
