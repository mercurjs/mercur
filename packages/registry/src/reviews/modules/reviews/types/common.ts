import { DeleteResponse, PaginatedResponse } from "@mercurjs/types"

export type ReviewReference = "product" | "seller"

export interface ReviewDTO {
  id: string
  reference: ReviewReference
  rating: number
  customer_note: string | null
  seller_note: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

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

export interface VendorReviewResponse {
  review: ReviewDTO
}

export type VendorReviewListResponse = PaginatedResponse<{
  reviews: ReviewDTO[]
}>
