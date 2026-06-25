import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import MediaModuleService from "../../../modules/media/service"

export type DeleteImagesStepInput = string[]

export const deleteImagesStepId = "delete-media-images"

export const deleteImagesStep = createStep(
  deleteImagesStepId,
  async (ids: DeleteImagesStepInput, { container }) => {
    if (!ids.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<MediaModuleService>(MercurModules.MEDIA)
    await service.softDeleteMediaImages(ids)

    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<MediaModuleService>(MercurModules.MEDIA)
    await service.restoreMediaImages(prevIds)
  }
)
