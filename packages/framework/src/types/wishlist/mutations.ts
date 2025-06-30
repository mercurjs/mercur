export type CreateWishlistDTO = {
  reference: 'product'
  reference_id: string
  customer_id: string
}

export type DeleteWishlistDTO = {
  id: string
  reference_id: string
}
