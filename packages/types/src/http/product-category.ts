import { PaginatedResponse, ProductCategoryDTO, ProductDTO } from "@medusajs/types"

export interface VendorProductCategoryResponse {
  /**
   * The product category's details.
   */
  product_category: ProductCategoryDTO
}

export type VendorProductCategoryListResponse = PaginatedResponse<{
  /**
   * The list of product categories.
   */
  product_categories: ProductCategoryDTO[]
}>

export type VendorProductCategoryProductsResponse = PaginatedResponse<{
  /**
   * The list of products in the category.
   */
  products: ProductDTO[]
}>
