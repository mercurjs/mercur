export interface OrderReturnRequest {
  id: string
  status: string
  order: any
  seller: any
  customer_note?: string
  seller_note?: string
  vendor_reviewer_date?: Date
  created_at: Date
  updated_at: Date
}

export type AdminOrderReturnRequest = OrderReturnRequest

export interface AdminUpdateOrderReturnRequest {
  status: string
  admin_reviewer_note: string
}
