export type CreateOrderGroupDTO = {
  customer_id?: string | null
  cart_id: string
}

export type UpdateOrderGroupDTO = {
  id: string
  customer_id?: string
  cart_id?: string
}
