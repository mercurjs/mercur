import type {
  BigNumberValue,
  CustomerDTO,
  OrderDTO,
  ReturnDTO,
} from "@medusajs/types"
import type { SellerDTO } from "../seller"

export enum ReturnRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  AWAITING_RETURN = "awaiting_return",
  RETURNED = "returned",
  REFUNDED = "refunded",
  DECLINED = "declined",
  WITHDRAWN = "withdrawn",
}

export enum ReturnRequestActorType {
  CUSTOMER = "customer",
  SELLER = "seller",
  ADMIN = "admin",
}

export interface ReturnRequestDTO {
  id: string
  status: ReturnRequestStatus
  return_id: string
  order_id: string
  seller_id: string
  customer_id: string | null
  requested_by: string | null
  requested_by_type: ReturnRequestActorType
  attachments: string[]
  return_required: boolean | null
  accepted_by: string | null
  accepted_by_type: ReturnRequestActorType | null
  accepted_at: Date | string | null
  declined_by: string | null
  declined_by_type: ReturnRequestActorType | null
  declined_at: Date | string | null
  decline_code: string | null
  decline_reason: string | null
  refunded_by: string | null
  refunded_at: Date | string | null
  refund_amount: BigNumberValue | null
  refund_note: string | null
  withdrawn_at: Date | string | null
  metadata: Record<string, unknown> | null
  return?: ReturnDTO
  order?: OrderDTO
  seller?: SellerDTO
  customer?: CustomerDTO
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
