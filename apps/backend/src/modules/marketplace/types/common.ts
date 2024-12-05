import {
  BigNumberInput,
  FulfillmentDTO,
  FulfillmentStatus,
  OrderAddressDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderLineItemDTO,
  OrderShippingMethodDTO,
  OrderStatus,
  PaymentStatus
} from '@medusajs/framework/types'

export type OrderSetDTO = {
  id: string
  created_at: Date
  updated_at: Date
  display_id: number
}

export type OrderSetWithOrdersDTO = OrderSetDTO & {
  orders: (OrderDTO & OrderDetailDTO)[]
}

export type FormattedOrderSetDTO = OrderSetDTO & {
  email: string
  currency_code: string

  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus

  shipping_address: OrderAddressDTO
  billing_address: OrderAddressDTO

  customer_id?: string
  sales_channel_id?: string

  fulfillments: FulfillmentDTO[]
  shipping_methods: OrderShippingMethodDTO[]

  items: OrderLineItemDTO[]

  total: BigNumberInput
  tax_total: BigNumberInput
  subtotal: BigNumberInput
  shipping_total: BigNumberInput
  shipping_tax_total: BigNumberInput
}
