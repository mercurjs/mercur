import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { ProductCategoryDTO, ProductDTO } from "../product/common"

export interface AdminProductCategoryResponse {
  product_category: ProductCategoryDTO
}

export type AdminProductCategoryListResponse = PaginatedResponse<{
  product_categories: ProductCategoryDTO[]
}>

export type AdminProductCategoryDeleteResponse =
  DeleteResponse<"product_category">

export interface VendorProductCategoryResponse {
  product_category: ProductCategoryDTO
}

export type VendorProductCategoryListResponse = PaginatedResponse<{
  product_categories: ProductCategoryDTO[]
}>

export type VendorProductCategoryProductsResponse = PaginatedResponse<{
  products: ProductDTO[]
}>
