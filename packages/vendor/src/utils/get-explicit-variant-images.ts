import type { HttpTypes } from "@medusajs/types"

type ImageWithVariants = HttpTypes.AdminProductImage & {
  variants?: Array<string | { id: string }>
}

export const getExplicitVariantImages = (
  images: ImageWithVariants[],
  variantId: string
): HttpTypes.AdminProductImage[] => {
  return images.filter((img) => {
    if (!img.variants || img.variants.length === 0) {
      return false
    }

    return img.variants.some((v) =>
      typeof v === "string" ? v === variantId : v.id === variantId
    )
  })
}
