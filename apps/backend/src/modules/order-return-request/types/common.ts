export type OrderReturnRequestLineItemDTO = {
  id: string
  line_item_id: string
  quantity: number
}

export type OrderReturnRequestDTO = {
  id: string
  line_items: OrderReturnRequestLineItemDTO[]
  customer_id: string
  customer_note: string
  shipping_option_id: string | null
  vendor_reviewer_id: string | null
  vendor_reviewer_note: string | null
  vendor_review_date: Date | null
  admin_reviewer_id: string | null
  admin_reviewer_note: string | null
  admin_review_date: Date | null
  status: string
}
