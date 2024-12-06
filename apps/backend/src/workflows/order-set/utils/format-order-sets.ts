import {
  FormattedOrderSetDTO,
  OrderSetWithOrdersDTO
} from '#/modules/marketplace/types'

import {
  BigNumberInput,
  CartDTO,
  CustomerDTO,
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
import { MathBN } from '@medusajs/framework/utils'

export const formatOrderSets = (
  orderSetsWithOrders: OrderSetWithOrdersDTO[]
): FormattedOrderSetDTO[] => {
  console.log('orderSetsWithOrders', orderSetsWithOrders)
  return orderSetsWithOrders.map((orderSet) => new OrderSetFormatter(orderSet))
}

class OrderSetFormatter {
  private orderSet_: OrderSetWithOrdersDTO

  orders: (OrderDTO & OrderDetailDTO)[]

  id: string
  display_id: number
  created_at: Date
  updated_at: Date
  email: string
  currency_code: string

  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus

  shipping_address: OrderAddressDTO
  billing_address: OrderAddressDTO

  customer_id?: string
  customer?: CustomerDTO

  cart_id: string
  cart: CartDTO

  fulfillments: FulfillmentDTO[]
  shipping_methods: OrderShippingMethodDTO[]

  items: OrderLineItemDTO[]

  total: BigNumberInput
  tax_total: BigNumberInput
  subtotal: BigNumberInput
  shipping_total: BigNumberInput
  shipping_tax_total: BigNumberInput

  constructor(orderSet: OrderSetWithOrdersDTO) {
    this.orders = orderSet.orders
    this.orderSet_ = orderSet

    this.id = this.orderSet_.id
    this.display_id = this.orderSet_.display_id
    this.created_at = this.orderSet_.created_at
    this.updated_at = this.orderSet_.updated_at

    this.email = this.orders[0].email!
    this.currency_code = this.orders[0].currency_code!

    this.status = this.getStatus_()
    this.payment_status = this.getPaymentStatus_()
    this.fulfillment_status = this.getFulfillmentStatus_()

    this.shipping_address = this.orders[0].shipping_address!
    this.billing_address = this.orders[0].billing_address!

    this.customer_id = this.orderSet_.customer_id
    this.customer = this.orderSet_.customer

    this.cart_id = this.orderSet_.cart_id
    this.cart = this.orderSet_.cart!

    this.fulfillments = this.getFulfillments_()
    this.shipping_methods = this.getShippingMethods_()

    this.items = this.getItems_()

    this.total = this.getTotal_()
    this.tax_total = this.getTaxTotal_()
    this.subtotal = this.getSubtotal_()
    this.shipping_total = this.getShippingTotal_()
    this.shipping_tax_total = this.getShippingTaxTotal_()
  }

  private getStatus_(): OrderStatus {
    const statuses = this.orders.map((order) => order.status)

    if (statuses.every((status) => status === 'completed')) {
      return 'completed'
    }

    if (statuses.every((status) => status === 'canceled')) {
      return 'canceled'
    }

    if (statuses.some((status) => status === 'requires_action')) {
      return 'requires_action'
    }

    return 'pending'
  }

  private getPaymentStatus_(): PaymentStatus {
    const statuses = this.orders.map((order) => order.payment_status)

    if (statuses.every((status) => status === 'awaiting')) {
      return 'awaiting'
    }

    if (statuses.every((status) => status === 'canceled')) {
      return 'canceled'
    }

    if (statuses.every((status) => status === 'captured')) {
      return 'captured'
    }

    if (statuses.every((status) => status === 'not_paid')) {
      return 'not_paid'
    }

    if (statuses.every((status) => status === 'refunded')) {
      return 'refunded'
    }

    if (statuses.every((status) => status === 'requires_action')) {
      return 'requires_action'
    }

    if (
      statuses.some(
        (status) => status === 'partially_refunded' || status === 'refunded'
      )
    ) {
      return 'partially_refunded'
    }

    if (
      statuses.some(
        (status) => status === 'partially_captured' || status === 'captured'
      )
    ) {
      return 'partially_captured'
    }

    if (
      statuses.some(
        (status) => status === 'partially_authorized' || status === 'authorized'
      )
    ) {
      return 'partially_authorized'
    }

    return 'authorized'
  }

  private getFulfillmentStatus_(): FulfillmentStatus {
    const statuses = this.orders.map((order) => order.fulfillment_status)

    if (statuses.every((status) => status === 'canceled')) {
      return 'canceled'
    }

    if (statuses.every((status) => status === 'delivered')) {
      return 'delivered'
    }

    if (statuses.every((status) => status === 'fulfilled')) {
      return 'fulfilled'
    }

    if (statuses.every((status) => status === 'shipped')) {
      return 'shipped'
    }

    if (
      statuses.some(
        (status) => status === 'partially_delivered' || status === 'delivered'
      )
    ) {
      return 'partially_delivered'
    }

    if (
      statuses.some(
        (status) => status === 'partially_shipped' || status === 'shipped'
      )
    ) {
      return 'partially_shipped'
    }

    if (
      statuses.some(
        (status) => status === 'partially_fulfilled' || status === 'fulfilled'
      )
    ) {
      return 'partially_fulfilled'
    }

    return 'not_fulfilled'
  }

  private getFulfillments_(): FulfillmentDTO[] {
    return this.orders.map((order) => order.fulfillments).flat()
  }

  private getShippingMethods_(): OrderShippingMethodDTO[] {
    return this.orders.map((order) => order.shipping_methods!).flat()
  }

  private getItems_(): OrderLineItemDTO[] {
    return this.orders.map((order) => order.items!).flat()
  }

  private getTotal_() {
    return this.items.reduce(
      (acc, item) => MathBN.add(acc, item.total),
      MathBN.convert(0)
    )
  }

  private getTaxTotal_() {
    return this.items.reduce(
      (acc, item) => MathBN.add(acc, item.tax_total),
      MathBN.convert(0)
    )
  }

  private getSubtotal_() {
    return MathBN.sub(this.total, this.tax_total)
  }

  private getShippingTotal_() {
    return this.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_total!),
      MathBN.convert(0)
    )
  }

  private getShippingTaxTotal_() {
    return this.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_tax_total!),
      MathBN.convert(0)
    )
  }
}
