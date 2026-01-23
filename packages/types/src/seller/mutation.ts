import { SellerStatus } from "./common"

export type CreateSellerDTO = {
  name: string
  handle: string
  email: string
  phone?: string | null
  logo?: string | null
  cover_image?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  status?: SellerStatus
}

export type UpdateSellerDTO = {
  id: string
  name?: string
  handle?: string
  email?: string
  phone?: string | null
  logo?: string | null
  cover_image?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  country_code?: string | null
  province?: string | null
  postal_code?: string | null
  status?: SellerStatus
}
