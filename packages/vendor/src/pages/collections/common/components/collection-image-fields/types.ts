/** Shape of a collection image as returned by the vendor API (linked `images`). */
export type CollectionApiImage = {
  id: string
  url: string
  type: string | null
  is_thumbnail: boolean
  is_banner: boolean
  rank?: number
}

export type CollectionWithImages = {
  media_images?: CollectionApiImage[] | null
}

/** Gallery images (type = null), ordered by rank. */
export const getCollectionGallery = (
  images?: CollectionApiImage[] | null
): CollectionApiImage[] =>
  (images ?? [])
    .filter((image) => !image.type)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

/** The single icon image (type = "icon"), or null. */
export const getCollectionIcon = (
  images?: CollectionApiImage[] | null
): CollectionApiImage | null =>
  (images ?? []).find((image) => image.type === "icon") ?? null
