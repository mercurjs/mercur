import { Link } from "@medusajs/framework/modules-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import MediaModuleService from "../../../modules/media/service"

export interface CategoryMediaInput {
  url: string
  is_thumbnail?: boolean
  is_banner?: boolean
  rank?: number
}

export interface SetCategoryImagesStepInput {
  category_id: string
  /** Replace the gallery (type = null) when provided. */
  media?: CategoryMediaInput[]
  /** Replace the icon (type = "icon") when the key is present. */
  icon?: string | null
}

export const setCategoryImagesStepId = "set-category-images"

type ExistingImage = { id: string; type: string | null }

/**
 * Full-replace a category's gallery and/or icon images.
 *
 * Invariants (enforced here, not by the DB): at most one gallery image
 * with `is_thumbnail`, at most one with `is_banner`, at most one icon.
 */
export const setCategoryImagesStep = createStep(
  setCategoryImagesStepId,
  async (input: SetCategoryImagesStepInput, { container }) => {
    const replaceMedia = input.media !== undefined
    const replaceIcon = input.icon !== undefined

    if (!replaceMedia && !replaceIcon) {
      return new StepResponse({ createdIds: [] }, { createdIds: [] })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const mediaService =
      container.resolve<MediaModuleService>(MercurModules.MEDIA)
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const { data } = await query.graph({
      entity: "product_category",
      fields: ["id", "images.id", "images.type"],
      filters: { id: input.category_id },
    })

    const existing: ExistingImage[] = (data?.[0]?.images ?? []) as ExistingImage[]
    const existingGallery = existing.filter((img) => !img.type)
    const existingIcon = existing.filter((img) => img.type === "icon")

    // Build the new image rows.
    const toCreate: {
      url: string
      type: string | null
      is_thumbnail: boolean
      is_banner: boolean
      rank: number
    }[] = []

    if (replaceMedia) {
      let thumbnailTaken = false
      let bannerTaken = false
      input.media!.forEach((m, index) => {
        const is_thumbnail = !!m.is_thumbnail && !thumbnailTaken
        const is_banner = !!m.is_banner && !bannerTaken
        thumbnailTaken = thumbnailTaken || is_thumbnail
        bannerTaken = bannerTaken || is_banner
        toCreate.push({
          url: m.url,
          type: null,
          is_thumbnail,
          is_banner,
          rank: m.rank ?? index,
        })
      })
    }

    if (replaceIcon && input.icon) {
      toCreate.push({
        url: input.icon,
        type: "icon",
        is_thumbnail: false,
        is_banner: false,
        rank: 0,
      })
    }

    // Create + link the new images first, so a failure leaves the old ones.
    let createdIds: string[] = []
    if (toCreate.length) {
      const created = await mediaService.createImages(toCreate)
      createdIds = created.map((img: { id: string }) => img.id)
      await remoteLink.create(
        createdIds.map((image_id) => ({
          [Modules.PRODUCT]: { product_category_id: input.category_id },
          [MercurModules.MEDIA]: { image_id },
        }))
      )
    }

    // Remove the old images this call is replacing.
    const toRemove: string[] = []
    if (replaceMedia) {
      toRemove.push(...existingGallery.map((img) => img.id))
    }
    if (replaceIcon) {
      toRemove.push(...existingIcon.map((img) => img.id))
    }

    if (toRemove.length) {
      await remoteLink.dismiss(
        toRemove.map((image_id) => ({
          [Modules.PRODUCT]: { product_category_id: input.category_id },
          [MercurModules.MEDIA]: { image_id },
        }))
      )
      await mediaService.deleteImages(toRemove)
    }

    return new StepResponse({ createdIds }, { createdIds })
  },
  async (compensateData, { container }) => {
    const createdIds = compensateData?.createdIds ?? []
    if (!createdIds.length) {
      return
    }
    const mediaService =
      container.resolve<MediaModuleService>(MercurModules.MEDIA)
    await mediaService.deleteImages(createdIds)
  }
)
