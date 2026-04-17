import {
  PaginatedResponse,
  ProductDTO,
  ProductVariantDTO,
  SalesChannelDTO,
} from "@medusajs/types"

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