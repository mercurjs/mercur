import { Product } from "./product"

type SellerAddress = {
  address_line?: string
  city?: string
  country_code?: string
  postal_code?: string
}

export type SellerProps = SellerAddress & {
  id: string
  name: string
  handle: string
  description: string
  photo: string
  tax_id: string
  created_at: string
  reviews?: any[]
  products?: Product[]
  email?: string
  store_status?: "ACTIVE" | "SUSPENDED" | "INACTIVE"
}
