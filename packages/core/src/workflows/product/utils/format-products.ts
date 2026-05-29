import { ProductChangeStatus } from "@mercurjs/types"

/**
 * Mercur computed-field decorator over the stock Medusa product DTO.
 *
 * Mirrors `medusa/.../order/utils/aggregate-status.ts`: a workflow-level
 * util invoked inside a `transform` step that scans linked rows and
 * returns a formatted DTO. This is the single seam where the marketplace
 * layer adds computed fields to the stock product surface — new
 * computed fields go here rather than spawning a new util per field.
 *
 * Today only `requires_action` is computed (derived from the linked
 * `ProductChange` rows; replaces the legacy
 * `Product.status = 'requires_action'` enum value the override module
 * shipped). The util is intentionally generic so callers can include
 * additional fields without forcing the wrapper signature to change.
 */
type RawProduct = {
  changes?: Array<{ status?: ProductChangeStatus | string | null }>
  [key: string]: unknown
}

export type FormattedProduct<T extends RawProduct> = T & {
  requires_action: boolean
}

export function formatProducts<T extends RawProduct>(
  products: T[],
): FormattedProduct<T>[] {
  return products.map((product) => ({
    ...product,
    requires_action:
      product.changes?.some(
        (c) => c.status === ProductChangeStatus.REQUIRES_ACTION,
      ) ?? false,
  }))
}
