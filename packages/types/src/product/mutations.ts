import { AttributeType, ProductStatus, RejectionReasonType } from "./common";

// --- ProductImage ---

export interface CreateProductImageDTO {
  url: string;
  rank?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductImageDTO {
  url?: string;
  rank?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpsertProductImageDTO {
  id?: string;
  url: string;
  rank?: number;
  metadata?: Record<string, unknown> | null;
}

// --- ProductType ---

export interface CreateProductTypeDTO {
  value: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductTypeDTO {
  value?: string;
  metadata?: Record<string, unknown> | null;
}

// --- ProductTag ---

export interface CreateProductTagDTO {
  value: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductTagDTO {
  value?: string;
  metadata?: Record<string, unknown> | null;
}

// --- ProductCollection ---

export interface CreateProductCollectionDTO {
  title: string;
  handle?: string;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductCollectionDTO {
  title?: string;
  handle?: string;
  metadata?: Record<string, unknown> | null;
}

// --- ProductBrand ---

export interface CreateProductBrandDTO {
  name: string;
  handle?: string;
  is_restricted?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductBrandDTO {
  name?: string;
  handle?: string;
  is_restricted?: boolean;
  metadata?: Record<string, unknown> | null;
}

// --- ProductAttributeValue ---

export interface CreateProductAttributeValueDTO {
  handle?: string;
  name: string;
  rank?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductAttributeValueDTO {
  handle?: string;
  name?: string;
  rank?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

// --- ProductAttribute ---

export interface CreateProductAttributeDTO {
  handle?: string;
  name: string;
  description?: string | null;
  type: AttributeType;
  is_required?: boolean;
  is_filterable?: boolean;
  is_variant_axis?: boolean;
  rank?: number;
  is_active?: boolean;
  created_by?: string | null;
  metadata?: Record<string, unknown> | null;
  values?: CreateProductAttributeValueDTO[];
}

export interface UpdateProductAttributeDTO {
  handle?: string;
  name?: string;
  description?: string | null;
  type?: AttributeType;
  is_required?: boolean;
  is_filterable?: boolean;
  is_variant_axis?: boolean;
  rank?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

// --- ProductCategory ---

export interface CreateProductCategoryDTO {
  name: string;
  description?: string;
  handle?: string;
  is_active?: boolean;
  is_internal?: boolean;
  is_restricted?: boolean;
  rank?: number;
  parent_category_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductCategoryDTO {
  name?: string;
  description?: string;
  handle?: string;
  is_active?: boolean;
  is_internal?: boolean;
  is_restricted?: boolean;
  rank?: number;
  parent_category_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

// --- ProductVariant ---

export interface CreateProductVariantDTO {
  title: string;
  sku?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
  hs_code?: string | null;
  origin_country?: string | null;
  mid_code?: string | null;
  material?: string | null;
  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;
  variant_rank?: number | null;
  thumbnail?: string | null;
  isbn?: string | null;
  asin?: string | null;
  gtin?: string | null;
  metadata?: Record<string, unknown> | null;
  product_id?: string;
}

export interface UpdateProductVariantDTO {
  title?: string;
  sku?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
  hs_code?: string | null;
  origin_country?: string | null;
  mid_code?: string | null;
  material?: string | null;
  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;
  variant_rank?: number | null;
  thumbnail?: string | null;
  isbn?: string | null;
  asin?: string | null;
  gtin?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpsertProductVariantDTO extends UpdateProductVariantDTO {
  id?: string;
  title: string;
}

// --- Product ---

export interface CreateProductDTO {
  title: string;
  handle?: string;
  subtitle?: string | null;
  description?: string | null;
  is_giftcard?: boolean;
  thumbnail?: string | null;
  weight?: string | null;
  length?: string | null;
  height?: string | null;
  width?: string | null;
  origin_country?: string | null;
  hs_code?: string | null;
  mid_code?: string | null;
  material?: string | null;
  discountable?: boolean;
  external_id?: string | null;
  status?: ProductStatus;
  is_active?: boolean;
  is_restricted?: boolean;
  created_by?: string | null;
  created_by_actor?: string | null;
  metadata?: Record<string, unknown> | null;
  type_id?: string | null;
  brand_id?: string | null;
  collection_id?: string | null;
  tag_ids?: string[];
  category_ids?: string[];
  images?: UpsertProductImageDTO[];
  variants?: CreateProductVariantDTO[];
}

export interface UpdateProductDTO {
  title?: string;
  handle?: string;
  subtitle?: string | null;
  description?: string | null;
  is_giftcard?: boolean;
  thumbnail?: string | null;
  weight?: string | null;
  length?: string | null;
  height?: string | null;
  width?: string | null;
  origin_country?: string | null;
  hs_code?: string | null;
  mid_code?: string | null;
  material?: string | null;
  discountable?: boolean;
  external_id?: string | null;
  status?: ProductStatus;
  is_active?: boolean;
  is_restricted?: boolean;
  metadata?: Record<string, unknown> | null;
  type_id?: string | null;
  brand_id?: string | null;
  collection_id?: string | null;
  tag_ids?: string[];
  category_ids?: string[];
  images?: UpsertProductImageDTO[];
  variants?: UpsertProductVariantDTO[];
}

export interface UpsertProductDTO extends UpdateProductDTO {
  id?: string;
  title: string;
}

// --- ProductRejectionReason ---

export interface CreateProductRejectionReasonDTO {
  code: string;
  label: string;
  type: RejectionReasonType;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateProductRejectionReasonDTO {
  code?: string;
  label?: string;
  type?: RejectionReasonType;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

// --- ProductChange ---

export interface CreateProductChangeDTO {
  product_id: string;
  internal_note?: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

// --- ProductChangeAction ---

export interface CreateProductChangeActionDTO {
  product_change_id?: string;
  product_id: string;
  action: string;
  details?: Record<string, unknown>;
  internal_note?: string;
}
