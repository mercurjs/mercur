import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { ProductBrandDTO } from "../product/common"

export interface AdminProductBrandResponse {
  product_brand: ProductBrandDTO
}

export type AdminProductBrandListResponse = PaginatedResponse<{
  product_brands: ProductBrandDTO[]
}>

export type AdminProductBrandDeleteResponse = DeleteResponse<"product_brand">

export interface VendorProductBrandResponse {
  product_brand: ProductBrandDTO
}

export type VendorProductBrandListResponse = PaginatedResponse<{
  product_brands: ProductBrandDTO[]
}>
