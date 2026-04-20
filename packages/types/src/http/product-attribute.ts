import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { ProductAttributeDTO } from "../product/common"

export interface AdminProductAttributeResponse {
  product_attribute: ProductAttributeDTO
}

export type AdminProductAttributeListResponse = PaginatedResponse<{
  product_attributes: ProductAttributeDTO[]
}>

export type AdminProductAttributeDeleteResponse =
  DeleteResponse<"product_attribute">

export interface VendorProductAttributeResponse {
  product_attribute: ProductAttributeDTO
}

export type VendorProductAttributeListResponse = PaginatedResponse<{
  product_attributes: ProductAttributeDTO[]
}>
