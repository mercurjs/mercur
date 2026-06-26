import { sdk } from "@lib/client"
import { CategoryIconItem, CategoryMediaItem } from "./types"

export type CategoryImagesPayload = {
  media?: {
    url: string
    is_thumbnail?: boolean
    is_banner?: boolean
    rank?: number
  }[]
  icon?: string | null
}

/**
 * Resolve the create/update API payload for a category's images: uploads any
 * pending File objects (media + icon) and keeps already-uploaded URLs as-is.
 *
 * `media` / `icon` are only included when provided, so callers can update the
 * gallery and the icon independently.
 */
export const uploadCategoryImages = async ({
  media,
  icon,
}: {
  media?: CategoryMediaItem[]
  icon?: CategoryIconItem | null
}): Promise<CategoryImagesPayload> => {
  const payload: CategoryImagesPayload = {}

  if (media !== undefined) {
    payload.media = await Promise.all(
      media.map(async (item, index) => {
        let url = item.url
        if (item.file) {
          const uploaded = await sdk.admin.uploads.mutate({
            files: [item.file],
          })
          url = uploaded.files?.[0]?.url ?? url
        }
        return {
          url,
          is_thumbnail: item.is_thumbnail,
          is_banner: item.is_banner,
          rank: index,
        }
      })
    )
  }

  if (icon !== undefined) {
    if (!icon) {
      payload.icon = null
    } else if (icon.file) {
      const uploaded = await sdk.admin.uploads.mutate({ files: [icon.file] })
      payload.icon = uploaded.files?.[0]?.url ?? icon.url
    } else {
      payload.icon = icon.url
    }
  }

  return payload
}
