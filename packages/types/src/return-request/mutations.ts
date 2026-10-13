import { ReturnRequestActorType, ReturnRequestStatus } from "./common"

export interface CreateReturnRequestDTO {
  return_id: string
  order_id: string
  seller_id: string
  customer_id?: string | null
  requested_by?: string | null
  requested_by_type: ReturnRequestActorType
  note?: string | null
  attachments?: string[]
  metadata?: Record<string, unknown> | null
}

export interface UpdateReturnRequestDTO {
  id: string
  status?: ReturnRequestStatus
  return_required?: boolean | null
  accepted_by?: string | null
  accepted_by_type?: ReturnRequestActorType | null
  accepted_at?: Date | null
  declined_by?: string | null
  declined_by_type?: ReturnRequestActorType | null
  declined_at?: Date | null
  decline_code?: string | null
  decline_reason?: string | null
  refunded_by?: string | null
  refunded_at?: Date | null
  refund_amount?: number | null
  refund_note?: string | null
  withdrawn_at?: Date | null
  metadata?: Record<string, unknown> | null
}
