export interface VendorSeller {
  id: string
  created_at: string
  updated_at: string
  name: string
  description?: string | null
  store_status: string
  handle: string
  email?: string | null
  phone?: string | null
  photo?: string | null
  address_line?: string | null
  postal_code?: string | null
  city?: string | null
  state?: string | null
  country_code?: string | null
  tax_id?: string | null
  members?: VendorMember[]
}

export interface VendorMember {
  id: string
  created_at: string
  updated_at: string
  role: 'owner' | 'admin' | 'member'
  email: string
  name?: string | null
  bio?: string | null
  photo?: string | null
}
