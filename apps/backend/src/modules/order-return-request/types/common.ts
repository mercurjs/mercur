export type OrderReturnRequestDTO = {
  id: string
  line_items: string[]
  customer_id: string
  customer_note: string
  vendor_reviewer_id: string | null
  vendor_reviewer_note: string | null
  vendor_review_date: Date | null
  admin_reviewer_id: string | null
  admin_reviewer_note: string | null
  admin_review_date: Date | null
  status: string
}
