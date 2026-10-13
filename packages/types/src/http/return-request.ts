import type { OrderPreviewDTO, PaginatedResponse } from "@medusajs/types"
import type { ReturnRequestActorType, ReturnRequestDTO } from "../return-request"

export interface ReturnRequestItemInput {
  id: string
  quantity: number
  reason_id?: string
  note?: string
}

export interface StoreCreateReturnRequest {
  order_id: string
  items: ReturnRequestItemInput[]
  description?: string
  attachments?: string[]
}

export interface StoreReturnRequestResponse {
  return_request: ReturnRequestDTO
}

export type StoreReturnRequestListResponse = PaginatedResponse<{
  return_requests: ReturnRequestDTO[]
}>

export interface VendorCreateReturnRequest {
  order_id: string
  items: ReturnRequestItemInput[]
  description?: string
  attachments?: string[]
}

export interface VendorAcceptReturnRequest {
  return_required: boolean
  location_id?: string
  shipping_option_id?: string
  custom_amount?: number
}

export interface VendorDeclineReturnRequest {
  decline_reason: string
  decline_code?: string
}

export interface VendorReturnRequestResponse {
  return_request: ReturnRequestDTO
}

export interface VendorReturnRequestPreviewResponse {
  return_request: ReturnRequestDTO
  order_preview: OrderPreviewDTO
}

export type VendorReturnRequestListResponse = PaginatedResponse<{
  return_requests: ReturnRequestDTO[]
}>

export interface AdminCreateReturnRequest extends VendorCreateReturnRequest {
  requested_by_type: Exclude<ReturnRequestActorType, "admin">
}

export type AdminAcceptReturnRequest = VendorAcceptReturnRequest

export type AdminDeclineReturnRequest = VendorDeclineReturnRequest

export interface AdminApproveReturnRequest {
  refund_amount?: number
  refund_note?: string
  refund_shipping?: boolean
}

export interface AdminReturnRequestResponse {
  return_request: ReturnRequestDTO
}

export interface AdminReturnRequestPreviewResponse {
  return_request: ReturnRequestDTO
  order_preview: OrderPreviewDTO
}

export type AdminReturnRequestListResponse = PaginatedResponse<{
  return_requests: ReturnRequestDTO[]
}>
