import { OrderDetailDTO } from '@medusajs/framework/types'
import { MathBN, isDefined } from '@medusajs/framework/utils'

export const getLastFulfillmentStatus = (order: OrderDetailDTO) => {
  const FulfillmentStatus = {
    NOT_FULFILLED: 'not_fulfilled',
    PARTIALLY_FULFILLED: 'partially_fulfilled',
    FULFILLED: 'fulfilled',
    PARTIALLY_SHIPPED: 'partially_shipped',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    PARTIALLY_DELIVERED: 'partially_delivered',
    CANCELED: 'canceled'
  }

  const fulfillmentStatus = {}

  for (const status in FulfillmentStatus) {
    fulfillmentStatus[FulfillmentStatus[status]] = 0
  }

  const statusMap = {
    canceled_at: FulfillmentStatus.CANCELED,
    delivered_at: FulfillmentStatus.DELIVERED,
    shipped_at: FulfillmentStatus.SHIPPED,
    packed_at: FulfillmentStatus.FULFILLED
  }

  for (const fulfillmentCollection of order.fulfillments) {
    for (const key in statusMap) {
      if (fulfillmentCollection[key]) {
        fulfillmentStatus[statusMap[key]] += 1
        break
      }
    }
  }

  const totalFulfillments = order.fulfillments.length
  const totalFulfillmentsExceptCanceled =
    totalFulfillments - fulfillmentStatus[FulfillmentStatus.CANCELED]

  const hasUnfulfilledItems =
    (order.items || [])?.filter(
      (i) =>
        isDefined(i?.detail?.raw_fulfilled_quantity) &&
        MathBN.lt(i.detail.raw_fulfilled_quantity, i.raw_quantity)
    ).length > 0

  if (fulfillmentStatus[FulfillmentStatus.DELIVERED] > 0) {
    if (
      fulfillmentStatus[FulfillmentStatus.DELIVERED] ===
        totalFulfillmentsExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.DELIVERED
    }

    return FulfillmentStatus.PARTIALLY_DELIVERED
  }

  if (fulfillmentStatus[FulfillmentStatus.SHIPPED] > 0) {
    if (
      fulfillmentStatus[FulfillmentStatus.SHIPPED] ===
        totalFulfillmentsExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.SHIPPED
    }

    return FulfillmentStatus.PARTIALLY_SHIPPED
  }

  if (fulfillmentStatus[FulfillmentStatus.FULFILLED] > 0) {
    if (
      fulfillmentStatus[FulfillmentStatus.FULFILLED] ===
        totalFulfillmentsExceptCanceled &&
      !hasUnfulfilledItems
    ) {
      return FulfillmentStatus.FULFILLED
    }

    return FulfillmentStatus.PARTIALLY_FULFILLED
  }

  if (
    fulfillmentStatus[FulfillmentStatus.CANCELED] > 0 &&
    fulfillmentStatus[FulfillmentStatus.CANCELED] === totalFulfillments
  ) {
    return FulfillmentStatus.CANCELED
  }

  return FulfillmentStatus.NOT_FULFILLED
}
