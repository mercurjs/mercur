import { DeleteResponse, PaginatedResponse } from "@mercurjs/types"

export type ReviewReference = "product" | "seller"

export type ReviewStatus = "pending" | "published" | "rejected"

export type ReviewReportReason =
  | "irrelevant_content"
  | "spam"
  | "inappropriate_language"
  | "bullying_or_harassment"
  | "personal_information"

export interface ReviewDTO {
  id: string
  reference: ReviewReference
  rating: number
  customer_note: string | null
  seller_note: string | null
  status: ReviewStatus
  created_at: Date | string
  updated_at: Date | string
  deleted_at: Date | string | null
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
