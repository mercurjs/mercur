import { HttpTypes } from "@medusajs/types"

export type ExtendedAdminProduct = Omit<HttpTypes.AdminProduct, "variants"> & {
  thumbnail: string
  images: Array<HttpTypes.AdminProductImage & { url: string }>
  attribute_values?: ExtendedAdminProductAttributeValues[]
  variants?: ExtendedAdminProductVariant[]
  shipping_profile: HttpTypes.AdminShippingProfile
}

export type ExtendedAdminProductAttributValuesAttribute = {
  id: string
  name: string
  description: string | null
  is_required: boolean
  is_filterable: boolean
  handle: string
  metadata: Record<string, unknown>
  ui_component: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ExtendedAdminProductAttributeValues = {
  id: string
  value: string
  rank: number
  metadata: Record<string, unknown> | null
  attribute_id: string
  attribute: ExtendedAdminProductAttributValuesAttribute
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ExtendedAdminProductResponse = Omit<
  HttpTypes.AdminProductResponse,
  "product"
> & {
  product: ExtendedAdminProduct
}

export type ExtendedAdminProductListResponse = Omit<
  HttpTypes.AdminProductListResponse,
  "products"
> & {
  products: ExtendedAdminProduct[]
}

export type ExtendedAdminPrice = HttpTypes.AdminPrice & {
  rules?: {
    region_id?: string
    [key: string]: unknown
  }
}

export type ExtendedAdminProductVariantInventoryItemLink =
  HttpTypes.AdminProductVariantInventoryItemLink & {
    required_quantity: number
  }

export type ExtendedAdminProductVariant = Omit<
  HttpTypes.AdminProductVariant,
  "prices" | "inventory_items"
> & {
  prices?: ExtendedAdminPrice[] | null
  inventory_items?: ExtendedAdminProductVariantInventoryItemLink[] | null
  inventory?: HttpTypes.AdminInventoryItem[] | null
}

export type ExtendedAdminProductWithVariants = Omit<
  ExtendedAdminProduct,
  "variants"
> & {
  variants?: ExtendedAdminProductVariant[]
}

/**
 * Union type for product stock grid rows
 * Can be either a variant (parent row) or an inventory item link (child row)
 */
export type ProductStockGridRow =
  | ExtendedAdminProductVariant
  | HttpTypes.AdminProductVariantInventoryItemLink

export interface ProductAttributePossibleValue {
  id: string
  value: string
  rank: number
  metadata: Record<string, any>
  attribute_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductAttributeCategory {
  id: string
  name: string
}

export interface ProductAttribute {
  id: string
  name: string
  description: string
  handle: string
  is_filterable: boolean
  ui_component: "toggle" | "select" | "text" | "text_area" | "unit"
  metadata: Record<string, any>
  possible_values: ProductAttributePossibleValue[]
  product_categories: ProductAttributeCategory[]
}

export interface ProductAttributesResponse {
  attributes: ProductAttribute[]
}

export interface AdminProductWithAttributes extends HttpTypes.AdminProduct {
  attribute_values?: {
    attribute_id: string
    value: string
  }[]
}
