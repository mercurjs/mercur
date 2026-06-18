/**
 * The ProductCategory ↔ media image link is aliased `media_images` (not
 * `images`) so it doesn't shadow the product module's own `Product.images`
 * relation in the global remote-query graph — `productCategory` lives in the
 * product module, so an `images` link alias collides there and silently
 * breaks `query.graph` resolution of `product.images` (see
 * `links/media-product-category-link.ts`).
 *
 * The public category contract stays `category.images`, so map the internal
 * `media_images` field back to `images` on the way out. Accepts a single
 * category or a list; returns the same shape with the field renamed.
 */
const remapOne = <T>(category: T): T => {
  if (!category || typeof category !== "object") {
    return category
  }
  const { media_images, ...rest } = category as Record<string, unknown>
  return { ...rest, images: media_images ?? [] } as T
}

export function remapCategoryMedia<T>(category: T): T
export function remapCategoryMedia<T>(categories: T[]): T[]
export function remapCategoryMedia<T>(input: T | T[]): T | T[] {
  return Array.isArray(input) ? input.map(remapOne) : remapOne(input)
}
