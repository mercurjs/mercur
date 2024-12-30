import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { COMISSION_MODULE } from '../../../modules/comission'
import ComissionModuleService from '../../../modules/comission/service'
import { CreateComissionLineDTO } from '../../../modules/comission/types'

export const createComissionLinesStep = createStep(
  'create-comission-lines',
  async (input: CreateComissionLineDTO[], { container }) => {
    const service = container.resolve(
      COMISSION_MODULE
    ) as ComissionModuleService

    const result = await service.createComissionLines(input)

    return new StepResponse(result)
  }
)
