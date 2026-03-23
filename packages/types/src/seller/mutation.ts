export interface CreateSellerDTO {
  name: string
  handle?: string
  email: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  external_id?: string | null
  currency_code: string
  status?: string
  status_reason?: string | null
  is_premium?: boolean
  closed_from?: Date | null
  closed_to?: Date | null
  metadata?: Record<string, unknown> | null
}

export interface UpdateSellerDTO {
  name?: string
  handle?: string
  email?: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  external_id?: string | null
  status?: string
  status_reason?: string | null
  is_premium?: boolean
  closed_from?: Date | null
  closed_to?: Date | null
  metadata?: Record<string, unknown> | null
}
