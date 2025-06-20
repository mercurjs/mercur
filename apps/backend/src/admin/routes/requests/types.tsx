export interface AdminRequest {
  id?: string
  created_at?: string
  updated_at?: string
  type?: string
  data?: object
  submitter_id?: string
  reviewer_id?: string | null
  reviewer_note?: string | null
  status?: string
  seller?: {
    id?: string
    name?: string
  }
}

export interface ReviewRemoveRequest {
  type: 'review_remove'
  data: {
    review_id?: string
    reason?: string
  }
}

export interface OrderReturnRequestLineItem {
  id: string
  line_item_id: string
  quantity: number
}

export interface AdminOrderReturnRequest {
  id: string
  customer_id?: string
  customer_note?: string
  vendor_reviewer_id?: string
  vendor_reviewer_note?: string
  vendor_reviewer_date?: string
  admin_reviewer_id?: string
  admin_reviewer_note?: string
  admin_reviewer_date?: string
  status?: 'pending' | 'refunded' | 'withdrawn' | 'escalated' | 'canceled'
  order?: {
    id?: string
    customer?: {
      first_name?: string
      last_name?: string
    }
  }
  seller?: {
    id?: string
    name?: string
  }
  line_items?: OrderReturnRequestLineItem[]
  created_at?: string
  updated_at?: string
}

export interface AdminReviewRequest {
  reviewer_note?: string
  status?: 'accepted' | 'rejected'
}

export interface AdminUpdateOrderReturnRequest {
  status: string
  admin_reviewer_note: string
}
