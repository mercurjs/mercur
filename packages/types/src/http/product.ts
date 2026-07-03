import {
  DeleteResponse,
  PaginatedResponse,
  SalesChannelDTO,
} from "@medusajs/types"
import { ProductDTO, ProductVariantDTO } from "../product/common"

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