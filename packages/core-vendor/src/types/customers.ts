import { HttpTypes } from "@medusajs/types"

export interface CustomerFilters {
  groups?: string[]
  has_account?: boolean
  order?: string
  created_at?: Date
  updated_at?: Date
  q?: string
}

export type AdminCustomer = HttpTypes.AdminCustomer
