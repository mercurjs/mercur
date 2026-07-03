import type { ProductStatus as UpstreamProductStatus } from "@medusajs/types"

/**
 * Mirror of Medusa's `ProductStatus` string union as a runtime const so
 * consumers can keep doing `ProductStatus.PUBLISHED`-style member access
 * AND get the same string-union type when used as a type position.
 *
 * `REQUIRES_ACTION` is intentionally absent — the concept moved to
 * `ProductChangeStatus.REQUIRES_ACTION` (any pending product-change row
 * with that status flips the computed `Product.requires_action`
 * boolean). See SPEC-008.
 */
export const ProductStatus = {
  DRAFT: "draft",
  PROPOSED: "proposed",
  PUBLISHED: "published",
  REJECTED: "rejected",
} as const satisfies Record<string, UpstreamProductStatus>

export type ProductStatus = UpstreamProductStatus
