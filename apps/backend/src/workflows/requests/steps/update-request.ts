import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

import { UpdateRequestDTO } from '@mercurjs/framework'
import { REQUESTS_MODULE, RequestsModuleService } from '@mercurjs/requests'

export const updateRequestStep = createStep(
  'update-request',
  async (input: UpdateRequestDTO, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE)

    const request = await service.updateRequests(input)

    return new StepResponse(request, request.id)
  }
)
