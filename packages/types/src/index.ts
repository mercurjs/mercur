export * from '@medusajs/types'

// Seller types
export * from "./seller"

// Order Group types
export * from "./order-group"

// Commission types
export * from "./commission"

// HTTP types
export * as HttpTypes from "./http"

// Subscription types
export * from "./subscription"

// Payout types
export * from "./payout"

// Product types — explicit re-export to override Medusa's product types
// (this module replaces Medusa's built-in product module)
export {
  // Enums
  ProductStatus,
  AttributeType,
  RejectionReasonType,
  ProductChangeStatus,
  // common DTOs
  type ProductDTO,
  type ProductVariantDTO,
  type ProductCategoryDTO,
  type ProductCollectionDTO,
  type ProductTypeDTO,
  type ProductTagDTO,
  type ProductImageDTO,
  type ProductVariantProductImageDTO,
  type ProductBrandDTO,
  type ProductAttributeDTO,
  type ProductAttributeValueDTO,
  type ProductRejectionReasonDTO,
  type ProductChangeDTO,
  type ProductChangeActionDTO,
  // mutations
  type CreateProductDTO,
  type UpdateProductDTO,
  type UpsertProductDTO,
  type CreateProductVariantDTO,
  type UpdateProductVariantDTO,
  type UpsertProductVariantDTO,
  type CreateProductCategoryDTO,
  type UpdateProductCategoryDTO,
  type CreateProductCollectionDTO,
  type UpdateProductCollectionDTO,
  type CreateProductTypeDTO,
  type UpdateProductTypeDTO,
  type CreateProductTagDTO,
  type UpdateProductTagDTO,
  type CreateProductImageDTO,
  type UpdateProductImageDTO,
  type UpsertProductImageDTO,
  type CreateProductBrandDTO,
  type UpdateProductBrandDTO,
  type CreateProductAttributeDTO,
  type UpdateProductAttributeDTO,
  type CreateProductAttributeValueDTO,
  type UpdateProductAttributeValueDTO,
  type CreateProductRejectionReasonDTO,
  type UpdateProductRejectionReasonDTO,
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