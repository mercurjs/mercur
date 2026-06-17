import {
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createImagesStep } from "../steps/create-images"
import { deleteImagesStep } from "../steps/delete-images"

export type CategoryMediaInput = {
  url: string
  is_thumbnail?: boolean
  is_banner?: boolean
  rank?: number
}

export type SetCategoryImagesWorkflowInput = {
  category_id: string
  /** Replace the gallery (type = null) when provided. */
  media?: CategoryMediaInput[]
  /** Replace the icon (type = "icon") when the key is present; null clears it. */
  icon?: string | null
}

export const setCategoryImagesWorkflowId = "mercur-set-category-images"

/**
 * Replaces a category's media gallery and/or icon, composed from small steps:
 * read existing → create new `Image` rows → link them → unlink + delete the
 * replaced ones. Each step self-compensates.
 *
 * Invariants (applied in the transform): at most one gallery thumbnail, one
 * gallery banner, one icon per category. An image may be both thumbnail and
 * banner.
 */
export const setCategoryImagesWorkflow = createWorkflow(
  setCategoryImagesWorkflowId,
  (input: SetCategoryImagesWorkflowInput) => {
    const existing = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "images.id", "images.type"],
      filters: { id: input.category_id },
    })

    const toCreate = transform({ input }, ({ input }) => {
      const rows: {
        url: string
        type: string | null
        is_thumbnail: boolean
        is_banner: boolean
        rank: number
      }[] = []

      if (input.media !== undefined) {
        let thumbnailTaken = false
        let bannerTaken = false
        input.media.forEach((m, index) => {
          const is_thumbnail = !!m.is_thumbnail && !thumbnailTaken
          const is_banner = !!m.is_banner && !bannerTaken
          thumbnailTaken = thumbnailTaken || is_thumbnail
          bannerTaken = bannerTaken || is_banner
          rows.push({
            url: m.url,
            type: null,
            is_thumbnail,
            is_banner,
            rank: m.rank ?? index,
          })
        })
      }

      if (input.icon !== undefined && input.icon) {
        rows.push({
          url: input.icon,
          type: "icon",
          is_thumbnail: false,
          is_banner: false,
          rank: 0,
        })
      }

      return rows
    })

    const created = createImagesStep(toCreate)

    const linksToCreate = transform(
      { created, input },
      ({ created, input }) =>
        (created ?? []).map((image: { id: string }) => ({
          [Modules.PRODUCT]: { product_category_id: input.category_id },
          [MercurModules.MEDIA]: { image_id: image.id },
        }))
    )
    createRemoteLinkStep(linksToCreate)

    const toRemoveIds = transform({ existing, input }, ({ existing, input }) => {
      const images: { id: string; type: string | null }[] =
        existing.data?.[0]?.images ?? []
      const ids: string[] = []
      if (input.media !== undefined) {
        ids.push(...images.filter((img) => !img.type).map((img) => img.id))
      }
      if (input.icon !== undefined) {
        ids.push(
          ...images.filter((img) => img.type === "icon").map((img) => img.id)
        )
      }
      return ids
    })

    const linksToDismiss = transform(
      { toRemoveIds, input },
      ({ toRemoveIds, input }) =>
        toRemoveIds.map((image_id: string) => ({
          [Modules.PRODUCT]: { product_category_id: input.category_id },
          [MercurModules.MEDIA]: { image_id },
        }))
    )
    dismissRemoteLinkStep(linksToDismiss)
    deleteImagesStep(toRemoveIds)
  }
)
