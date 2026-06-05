import { DeleteResponse, PaginatedResponse } from "@medusajs/types"
import { ReviewDTO } from "../review"

export interface VendorReviewResponse {
  review: ReviewDTO
}

export type VendorReviewListResponse = PaginatedResponse<{
  reviews: ReviewDTO[]
}>

export interface AdminReviewResponse {
  review: ReviewDTO
}

export type AdminReviewListResponse = PaginatedResponse<{
  reviews: ReviewDTO[]
}>

export interface StoreReviewResponse {
  review: ReviewDTO
}

export type StoreReviewListResponse = PaginatedResponse<{
  reviews: ReviewDTO[]
}>

export type StoreReviewDeleteResponse = DeleteResponse<"review">
