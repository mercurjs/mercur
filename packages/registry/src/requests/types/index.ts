import { PaginatedResponse } from "@mercurjs/types"

export enum RequestStatus {
  DRAFT = "draft",
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export interface RequestCustomFields {
  id: string
  request_status: RequestStatus
  submitter_id: string | null
  reviewer_id: string | null
  reviewer_note: string | null
  created_at: Date
  updated_at: Date
}

export interface RequestEntityResponse {
  id: string
  custom_fields: RequestCustomFields
  [key: string]: unknown
}

export interface AdminRequestResponse {
  request: RequestEntityResponse
}

export type AdminRequestListResponse = PaginatedResponse<{
  requests: RequestEntityResponse[]
}>

export interface VendorRequestResponse {
  request: RequestEntityResponse
}

export type VendorRequestListResponse = PaginatedResponse<{
  requests: RequestEntityResponse[]
}>
