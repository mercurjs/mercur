export * from '@medusajs/types'

// Seller types
export * from "./seller"

// Order Group types
export * from "./order-group"

// Commission types
export * from "./commission"

// HTTP types
export * as HttpTypes from "./http"

// Payout types
export * from "./payout"

// Offer types
export * from "./offer"

// Promotion cost types
export * from "./promotion-cost"

// Review types
export * from "./review"

// Product types — explicit re-export overrides Medusa's product surface.
// Mercur's runtime enums and Mercur-extended DTOs (Omit + intersection over
// upstream) win over the wholesale `export * from "@medusajs/types"` above.
// Types upstream declares verbatim (ProductImageDTO, ProductTypeDTO,
// ProductTagDTO, ProductCollectionDTO, etc.) come through the wholesale
// re-export unchanged.
// `ProductStatus` is Medusa's `"draft" | "proposed" | "published" |
// "rejected"` union. The matching runtime const is co-exported so
// consumers can keep doing `ProductStatus.PUBLISHED`-style access.
// `requires_action` is no longer a product status — it's a computed
// boolean derived from `ProductChange`.
export { ProductStatus } from "./product/status"
export {
  AttributeType,
  ProductChangeStatus,
  ProductChangeActionType,
  type ProductDTO,
  type ProductVariantDTO,
  type ProductCategoryDTO,
  type ProductAttributeDTO,
  type ProductAttributeValueDTO,
  type WrappedProductAttributeDTO,
  type WrappedProductAttributeValueDTO,
  type ProductChangeDTO,
  type ProductChangeActionDTO,
  type CreateProductDTO,
  type CreateProductAttributeDTO,
  type UpdateProductAttributeDTO,
  type CreateProductAttributeValueDTO,
  type UpdateProductAttributeValueDTO,
  type UpsertProductAttributeValueDTO,
  type ProductAttributeBatchAdd,
  type ProductAttributeBatchUpdate,
  type ProductAttributeBatchInput,
  type CreateProductChangeDTO,
  type CreateProductChangeActionDTO,
} from "./product"

// Modules
export * from "./modules"

// Custom fields types
export * from "./custom-fields"

// UI types
export * from "./dashboard"

// Feature flags
export * from "./feature-flags"