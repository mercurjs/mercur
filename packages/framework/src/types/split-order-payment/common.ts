export type SplitOrderPaymentDTO = {
  id: string
  status: string
  currency_code: string
  authorized_amount: number
  captured_amount: number
  refunded_amount: number
  payment_collection_id: string
}
