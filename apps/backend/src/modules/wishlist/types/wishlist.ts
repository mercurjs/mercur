export type WishlistProductVariant = {
  id: string
  prices: unknown
}

export type WishlistProduct = {
  id: string
  title: string
  handle: string
  subtitle: string
  description: string
  is_giftcard: boolean
  status: string
  thumbnail: string
  weight: number | null
  length: number | null
  height: number | null
  width: number | null
  origin_country: string | null
  hs_code: string | null
  mid_code: string | null
  material: string | null
  discountable: boolean
  external_id: string | null
  metadata: unknown
  type_id: string | null
  type: string | null
  collection_id: string | null
  collection: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  variants: WishlistProductVariant[]
}

export type Wishlist = {
  id: string
  products: WishlistProduct[]
}

export type WishlistItem = {
  wishlist_id: string
  wishlist: Wishlist
}

export type WishlistResponse = WishlistItem[]
