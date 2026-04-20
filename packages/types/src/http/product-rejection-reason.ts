import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { ProductRejectionReasonDTO } from "../product/common"

export interface AdminProductRejectionReasonResponse {
  product_rejection_reason: ProductRejectionReasonDTO
}

export type AdminProductRejectionReasonListResponse = PaginatedResponse<{
  product_rejection_reasons: ProductRejectionReasonDTO[]
}>

export type AdminProductRejectionReasonDeleteResponse =
  DeleteResponse<"product_rejection_reason">
