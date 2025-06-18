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

export interface AdminReviewRequest {
  reviewer_note?: string
  status?: 'accepted' | 'rejected'
}
