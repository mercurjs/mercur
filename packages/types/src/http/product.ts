import {
  DeleteResponse,
  PaginatedResponse,
  SalesChannelDTO,
} from "@medusajs/types"
import {
  ProductChangeStatus,
  ProductDTO,
  ProductVariantDTO,
} from "../product/common"
import { ProductStatus } from "../product/status"

export interface AdminProductResponse {
  product: ProductDTO
}

export type AdminProductListResponse = PaginatedResponse<{
  products: ProductDTO[]
}>

export type AdminProductDeleteResponse = DeleteResponse<"product">

export interface AdminProductVariantResponse {
  variant: ProductVariantDTO
}

export type AdminProductVariantListResponse = PaginatedResponse<{
  variants: ProductVariantDTO[]
}>

export interface VendorProductResponse {
  /**
   * The product's details.
   */
  product: ProductDTO
}

export type VendorProductListResponse = PaginatedResponse<{
  /**
   * The list of products.
   */
  products: ProductDTO[]
}>

export interface VendorProductVariantResponse {
  /**
   * The product variant's details.
   */
  variant: ProductVariantDTO
}

export type VendorProductVariantListResponse = PaginatedResponse<{
  /**
   * The list of product variants.
   */
  variants: ProductVariantDTO[]
}>

export interface VendorDeleteResponse {
  /**
   * The ID of the deleted resource.
   */
  id: string
  /**
   * The type of the deleted resource.
   */
  object: string
  /**
   * Whether the resource was deleted.
   */
  deleted: boolean
}

export interface VendorProduct extends ProductDTO {
  sales_channels?: SalesChannelDTO[];
}
export type AdminProductChangeInboxType = "new_product" | "update" | "delete"

export interface AdminProductChangeInboxItem {
  id: string
  product_id: string
  status: ProductChangeStatus
  type: AdminProductChangeInboxType
  action_count: number
  product_title: string
  product_thumbnail: string | null
  product_status: ProductStatus
  seller_id: string
  seller_name: string
  seller_handle: string
  created_by: string | null
  external_note: string | null
  internal_note: string | null
  created_at: string
  updated_at: string
}

export type AdminProductChangeInboxListResponse = PaginatedResponse<{
  product_changes: AdminProductChangeInboxItem[]
}>
