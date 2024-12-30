import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import ComissionModuleService from '../../../modules/comission/service'
import {
  ComissionRateDTO,
  UpdateComissionRateDTO
} from '../../../modules/comission/types'

export const updateComissionRateStep = createStep(
  'update-comission-rate',
  async (input: UpdateComissionRateDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    const previousData: ComissionRateDTO = await service.retrieveComissionRate(
      input.id
    )

    const updatedComissionRate = await service.updateComissionRates(input)

    return new StepResponse(updatedComissionRate, previousData)
  },
  async (previousData: ComissionRateDTO, { container }) => {
    const service = container.resolve<ComissionModuleService>(COMISSION_MODULE)

    await service.updateComissionRates(previousData)
  }
)
