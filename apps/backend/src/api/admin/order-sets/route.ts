import BigNumber from 'bignumber.js'

import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  CustomerDTO,
  FulfillmentDTO,
  FulfillmentStatus,
  OrderAddressDTO,
  OrderDTO,
  OrderDetailDTO,
  OrderLineItemDTO,
  OrderShippingMethodDTO,
  PaymentStatus,
  SalesChannelDTO
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MathBN,
  OrderStatus
} from '@medusajs/framework/utils'

import { OrderSetDTO } from '@mercurjs/types'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orderSets, metadata } = await query.graph({
    entity: 'order_set',
    fields: ['id', 'display_id', 'order.*'],
    filters: req.filterableFields,
    pagination: {
      ...req.remoteQueryConfig.pagination
    }
  })

  res.json({
    order_sets: orderSets.map(
      (orderSet) =>
        new FormattedOrderSet({
          orderSet: orderSet,
          orders: orderSet.order
        })
    ),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

// TODO: move this to the marketplace module
class FormattedOrderSet {
  private orderSet_: OrderSetDTO

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

  customer: CustomerDTO
  sales_channel: SalesChannelDTO

  fulfillments: FulfillmentDTO[]
  shipping_methods: OrderShippingMethodDTO[]

  items: OrderLineItemDTO[]

  total: BigNumber
  tax_total: BigNumber
  subtotal: BigNumber
  shipping_total: BigNumber
  shipping_tax_total: BigNumber

  constructor({
    orders,
    orderSet
  }: {
    orders: (OrderDTO & OrderDetailDTO)[]
    orderSet: OrderSetDTO
  }) {
    this.orders = orders
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

    this.customer = this.orders[0].customer
    this.sales_channel = this.orders[0].sales_channel

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
    // TODO: Implement
    return OrderStatus.COMPLETED
  }

  private getPaymentStatus_(): PaymentStatus {
    // TODO: Implement
    return 'captured'
  }

  private getFulfillmentStatus_(): FulfillmentStatus {
    // TODO: Implement
    return 'fulfilled'
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

  private getTotal_(): BigNumber {
    return this.items.reduce(
      (acc, item) => MathBN.add(acc, item.total),
      MathBN.div(0, 0)
    )
  }

  private getTaxTotal_(): BigNumber {
    return this.items.reduce(
      (acc, item) => MathBN.add(acc, item.tax_total),
      MathBN.div(0, 0)
    )
  }

  private getSubtotal_(): BigNumber {
    return this.getTotal_().minus(this.getTaxTotal_())
  }

  private getShippingTotal_(): BigNumber {
    return this.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_total!),
      MathBN.div(0, 0)
    )
  }

  private getShippingTaxTotal_(): BigNumber {
    return this.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_tax_total!),
      MathBN.div(0, 0)
    )
  }
}
