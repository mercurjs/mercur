export type CreateOrderGroupDTO = {
  customer_id?: string | null
  cart_id: string
  metadata?: Record<string, unknown> | null
}

export type UpdateOrderGroupDTO = {
  id: string
  customer_id?: string
  cart_id?: string
  metadata?: Record<string, unknown> | null
}
