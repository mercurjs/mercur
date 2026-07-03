/** Shape of a category image as returned by the vendor API (linked `images`). */
export type CategoryApiImage = {
  id: string
  url: string
  type: string | null
  is_thumbnail: boolean
  is_banner: boolean
  rank?: number
}

export type CategoryWithImages = {
  media_images?: CategoryApiImage[] | null
}

/** Gallery images (type = null), ordered by rank. */
export const getCategoryGallery = (
  images?: CategoryApiImage[] | null
): CategoryApiImage[] =>
  (images ?? [])
    .filter((image) => !image.type)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

/** The single icon image (type = "icon"), or null. */
export const getCategoryIcon = (
  images?: CategoryApiImage[] | null
): CategoryApiImage | null =>
  (images ?? []).find((image) => image.type === "icon") ?? null
