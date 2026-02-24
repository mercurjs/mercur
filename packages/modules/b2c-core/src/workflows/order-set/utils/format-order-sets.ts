import {
  OrderDTO,
  OrderDetailDTO,
  OrderStatus,
  PaymentCollectionStatus,
} from "@medusajs/framework/types";
import { BigNumber, MathBN } from "@medusajs/framework/utils";

import {
  FormattedOrderSetDTO,
  OrderSetDTO,
  OrderSetWithOrdersDTO,
} from "@mercurjs/framework";

import { getLastFulfillmentStatus } from "../../order/utils/aggregate-status";

export const formatOrderSets = (
  orderSetsWithOrders: OrderSetWithOrdersDTO[]
): FormattedOrderSetDTO[] => {
  return orderSetsWithOrders.map((orderSet) => {
    const taxTotal = orderSet.orders.reduce(
      (acc, order) => MathBN.add(acc, order.tax_total ?? 0),
      MathBN.convert(0)
    );

    const shippingTaxTotal = orderSet.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_tax_total ?? 0),
      MathBN.convert(0)
    );

    const shippingTotal = orderSet.orders.reduce(
      (acc, order) => MathBN.add(acc, order.shipping_total ?? 0),
      MathBN.convert(0)
    );

    const total = orderSet.orders.reduce(
      (acc, order) => MathBN.add(acc, order.total ?? 0),
      MathBN.convert(0)
    );

    const subtotal = MathBN.sub(total, taxTotal);

    const payment_status = getPaymentStatus(orderSet);

    const currency_code = orderSet.orders[0]?.currency_code;

    const ordersWithStatus = orderSet.orders.map((order) => ({
      ...order,
      fulfillment_status: getLastFulfillmentStatus(order),
      payment_status,
    })) as OrderDetailDTO[];

    return {
      ...orderSet,
      orders: ordersWithStatus,
      status: getStatus(orderSet.orders),
      payment_status,
      fulfillment_status: getFulfillmentStatus(ordersWithStatus),
      currency_code,
      tax_total: new BigNumber(taxTotal),
      shipping_tax_total: new BigNumber(shippingTaxTotal),
      shipping_total: new BigNumber(shippingTotal),
      total: new BigNumber(total),
      subtotal: new BigNumber(subtotal),
    };
  });
};

const getStatus = (orders: OrderDTO[]): OrderStatus => {
  const statuses = orders.map((order) => order.status);

  if (statuses.every((status) => status === "completed")) {
    return "completed";
  }

  if (statuses.every((status) => status === "canceled")) {
    return "canceled";
  }

  if (statuses.some((status) => status === "requires_action")) {
    return "requires_action";
  }

  return "pending";
};

const getPaymentStatus = (orderSet: OrderSetDTO): PaymentCollectionStatus => {
  return orderSet.payment_collection?.status ?? "not_paid";
};

export const getFulfillmentStatus = (orders: OrderDetailDTO[]) => {
  const statuses = orders.map((order) => order.fulfillment_status);

  if (statuses.every((status) => status === "canceled")) {
    return "canceled";
  }

  if (statuses.every((status) => status === "delivered")) {
    return "delivered";
  }

  if (statuses.every((status) => status === "fulfilled")) {
    return "fulfilled";
  }

  if (statuses.every((status) => status === "shipped")) {
    return "shipped";
  }

  if (
    statuses.some(
      (status) => status === "partially_delivered" || status === "delivered"
    )
  ) {
    return "partially_delivered";
  }

  if (
    statuses.some(
      (status) => status === "partially_shipped" || status === "shipped"
    )
  ) {
    return "partially_shipped";
  }

  if (
    statuses.some(
      (status) => status === "partially_fulfilled" || status === "fulfilled"
    )
  ) {
    return "partially_fulfilled";
  }

  return "not_fulfilled";
};
