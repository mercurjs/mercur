export type CreateOrderReturnRequestDTO = {
  order_id: string
  shipping_option_id: string
  line_items: { line_item_id: string; quantity: number }[]
  customer_id: string
  customer_note: string
}

export type VendorUpdateOrderReturnRequestDTO = {
  id: string
  vendor_reviewer_id: string
  vendor_reviewer_note: string
  vendor_review_date: Date
  status: string
}

export type AdminUpdateOrderReturnRequestDTO = {
  id: string
  admin_reviewer_id: string
  admin_reviewer_note: string
  admin_review_date: Date
  status: string
}
