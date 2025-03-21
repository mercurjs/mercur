import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { REQUESTS_MODULE } from '../../../modules/requests'
import RequestsModuleService from '../../../modules/requests/service'
import { UpdateRequestDTO } from '../../../modules/requests/types'

export const updateRequestStep = createStep(
  'update-request',
  async (input: UpdateRequestDTO, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

    const request = await service.updateRequests(input)

    return new StepResponse(request, request.id)
  }
)
