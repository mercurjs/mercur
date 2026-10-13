import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules, UpdateReturnRequestDTO } from "@mercurjs/types"

import type ReturnRequestModuleService from "../../../modules/return-request/service"

export const updateReturnRequestStepId = "rr-update-return-request"

export const updateReturnRequestStep = createStep(
  updateReturnRequestStepId,
  async (input: UpdateReturnRequestDTO, { container }) => {
    const service = container.resolve<ReturnRequestModuleService>(
      MercurModules.RETURN_REQUEST
    )

    const previous = await service.retrieveReturnRequest(input.id)

    const snapshot: UpdateReturnRequestDTO = { id: input.id }
    for (const key of Object.keys(input) as (keyof UpdateReturnRequestDTO)[]) {
      Object.assign(snapshot, { [key]: previous[key] })
    }

    const [request] = await service.updateReturnRequests([input])

    return new StepResponse(request, snapshot)
  },
  async (snapshot, { container }) => {
    if (!snapshot) {
      return
    }

    const service = container.resolve<ReturnRequestModuleService>(
      MercurModules.RETURN_REQUEST
    )

    await service.updateReturnRequests([snapshot])
  }
)
