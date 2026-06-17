import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import MediaModuleService from "../../../modules/media/service"

export type CreateImageInput = {
  url: string
  type?: string | null
  is_thumbnail?: boolean
  is_banner?: boolean
  rank?: number
}

export const createImagesStepId = "create-media-images"

/**
 * Creates `Image` rows in the media module. Compensation deletes them.
 */
export const createImagesStep = createStep(
  createImagesStepId,
  async (input: CreateImageInput[], { container }) => {
    if (!input.length) {
      return new StepResponse([], [])
    }

    const service = container.resolve<MediaModuleService>(MercurModules.MEDIA)
    const created = await service.createImages(input)

    return new StepResponse(
      created,
      created.map((image: { id: string }) => image.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }

    const service = container.resolve<MediaModuleService>(MercurModules.MEDIA)
    await service.deleteImages(createdIds)
  }
)
