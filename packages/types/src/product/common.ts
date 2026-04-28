import { SellerDTO } from "../seller/common"

// --- Enums ---

/**
 * Replaces Medusa's ProductStatus (draft/proposed/published/rejected)
 * with marketplace product acceptance workflow statuses.
 */
export enum ProductStatus {
  DRAFT = 'draft',
  PROPOSED = "proposed",
  PUBLISHED = "published",
  CHANGES_REQUIRED = "changes_required",
  REJECTED = "rejected",
}

/**
 * Data types for product attributes (business spec Section 4.3.2).
 * Determines validation rules and UI rendering.
 */
export enum AttributeType {
  SINGLE_SELECT = "single_select",
  MULTI_SELECT = "multi_select",
  UNIT = "unit",
  TOGGLE = "toggle",
  TEXT = "text",
}

/**
 * Rejection reason types (business spec Section 5.4).
 * Determines which status transition the reason is valid for.
 */
export enum RejectionReasonType {
  TEMPORARY = "temporary",
  PERMANENT = "permanent",
}

/**
 * Product change lifecycle statuses.
 * Matches OrderChange lifecycle pattern.
 */
export enum ProductChangeStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
  CANCELED = "canceled",
}

/**
 * Action types for ProductChangeAction.
 * Phase 1 only uses STATUS_CHANGE. Future phases add new types without migration.
 */
export enum ProductChangeActionType {
  STATUS_CHANGE = "STATUS_CHANGE",
}

// --- DTOs ---

// --- ProductImage ---

export interface ProductImageDTO {
  id: string;
  url: string;
  rank: number;
  metadata: Record<string, unknown> | null;
  product?: ProductDTO;
  product_id?: string;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductVariantProductImage ---

export interface ProductVariantProductImageDTO {
  id: string;
  variant_id: string;
  image_id: string;
  variant?: ProductVariantDTO;
  image?: ProductImageDTO;
}

// --- ProductType ---

export interface ProductTypeDTO {
  id: string;
  value: string;
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductTag ---

export interface ProductTagDTO {
  id: string;
  value: string;
  metadata: Record<string, unknown> | null;
  products?: ProductDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductCollection ---

export interface ProductCollectionDTO {
  id: string;
  title: string;
  handle: string;
  metadata: Record<string, unknown> | null;
  products?: ProductDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductBrand ---

export interface ProductBrandDTO {
  id: string;
  name: string;
  handle: string;
  is_restricted: boolean;
  metadata: Record<string, unknown> | null;
  products?: ProductDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductAttributeValue ---

export interface ProductAttributeValueDTO {
  id: string;
  handle: string | null;
  name: string;
  rank: number;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  attribute?: ProductAttributeDTO;
  attribute_id?: string;
  variants?: ProductVariantDTO[];
  products?: ProductDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductAttribute ---

export interface ProductAttributeDTO {
  id: string;
  handle: string | null;
  name: string;
  description: string | null;
  type: AttributeType;
  is_required: boolean;
  is_filterable: boolean;
  is_variant_axis: boolean;
  rank: number;
  is_active: boolean;
  created_by: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  values?: ProductAttributeValueDTO[];
  categories?: ProductCategoryDTO[];
  variant_products?: ProductDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductCategory ---

export interface ProductCategoryDTO {
  id: string;
  name: string;
  description: string;
  handle: string;
  mpath: string;
  is_active: boolean;
  is_internal: boolean;
  is_restricted: boolean;
  rank: number;
  metadata: Record<string, unknown> | null;
  parent_category: ProductCategoryDTO | null;
  parent_category_id: string | null;
  category_children: ProductCategoryDTO[];
  products?: ProductDTO[];
  attributes?: ProductAttributeDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductVariant ---

export interface ProductVariantDTO {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  ean: string | null;
  upc: string | null;
  allow_backorder: boolean;
  manage_inventory: boolean;
  hs_code: string | null;
  origin_country: string | null;
  mid_code: string | null;
  material: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  metadata: Record<string, unknown> | null;
  variant_rank: number | null;
  thumbnail: string | null;
  isbn: string | null;
  asin: string | null;
  gtin: string | null;
  product?: ProductDTO;
  product_id?: string;
  images?: ProductImageDTO[];
  attribute_values?: ProductAttributeValueDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- Product ---

export interface ProductDTO {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  is_giftcard: boolean;
  thumbnail: string | null;
  weight: string | null;
  length: string | null;
  height: string | null;
  width: string | null;
  origin_country: string | null;
  hs_code: string | null;
  mid_code: string | null;
  material: string | null;
  discountable: boolean;
  external_id: string | null;
  metadata: Record<string, unknown> | null;
  status: ProductStatus;
  is_restricted: boolean;
  created_by: string | null;
  created_by_actor: string | null;
  variants?: ProductVariantDTO[];
  type?: ProductTypeDTO | null;
  type_id?: string | null;
  brand?: ProductBrandDTO | null;
  brand_id?: string | null;
  tags?: ProductTagDTO[];
  images?: ProductImageDTO[];
  collection?: ProductCollectionDTO | null;
  collection_id?: string | null;
  categories?: ProductCategoryDTO[];
  variant_attributes?: ProductAttributeDTO[];
  custom_attributes?: ProductAttributeDTO[];
  attribute_values?: ProductAttributeValueDTO[];
  attributes?: ProductAttributeDTO[];
  sellers?: SellerDTO[];
  changes?: ProductChangeDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductRejectionReason ---

export interface ProductRejectionReasonDTO {
  id: string;
  code: string;
  label: string;
  type: RejectionReasonType;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  product_changes?: ProductChangeDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductChangeAction ---

export interface ProductChangeActionDTO {
  id: string;
  product_id: string;
  product_change_id: string | null;
  ordering: number;
  action: string;
  details: Record<string, unknown>;
  internal_note: string | null;
  applied: boolean;
  product_change?: ProductChangeDTO;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

// --- ProductChange ---

export interface ProductChangeDTO {
  id: string;
  product?: ProductDTO;
  product_id?: string;
  status: ProductChangeStatus;
  internal_note: string | null;
  created_by: string | null;
  confirmed_by: string | null;
  confirmed_at: string | Date | null;
  declined_by: string | null;
  declined_at: string | Date | null;
  declined_reason: string | null;
  canceled_by: string | null;
  canceled_at: string | Date | null;
  metadata: Record<string, unknown> | null;
  actions?: ProductChangeActionDTO[];
  rejection_reasons?: ProductRejectionReasonDTO[];
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}
