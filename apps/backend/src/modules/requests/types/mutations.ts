export type RequestStatus = 'pending' | 'accepted' | 'rejected'

export type CreateRequestDTO = {
  type: string
  data: any
  submitter_id: string
  reviewer_id?: string
  reviewer_note?: string
  status?: RequestStatus
}

export type UpdateRequestDTO = {
  id: string
  reviewer_id: string
  reviewer_note: string
  status: RequestStatus
}

export type AcceptRequestDTO = {
  id: string
  reviewer_id: string
  reviewer_note: string
  data: any
  status: RequestStatus
}
