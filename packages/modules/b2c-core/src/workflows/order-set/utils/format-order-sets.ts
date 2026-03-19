import {
  OrderDTO,
  OrderDetailDTO,
  OrderStatus,
  PaymentCollectionStatus,
  ProductOptionValueDTO,
} from "@medusajs/framework/types";
import { BigNumber, MathBN } from "@medusajs/framework/utils";

import {
  CanceledOrderItem,
  FormattedOrderSetDTO,
  OrderSetDTO,
  OrderSetWithOrdersDTO,
  OrderWithCanceledItems,
} from "@mercurjs/framework";

import { getLastFulfillmentStatus } from "../../order/utils/aggregate-status";

interface OrderLineItemWithVariant {
  id: string;
  quantity?: number;
  unit_price: number;
  variant_id?: string;
  thumbnail?: string | null;
  title: string;
  variant_title?: string;
  variant?: {
    title?: string;
    product?: {
      handle?: string;
    };
    options?: ProductOptionValueDTO[];
  };
  product?: {
    handle?: string;
  };
}

interface CanceledItemMapEntry {
  canceled_quantity: number;
  current_quantity: number;
  item: OrderLineItemWithVariant;
}

export const formatOrderSets = (
  orderSetsWithOrders: OrderSetWithOrdersDTO[],
  canceledItemsMap?: Record<string, Record<string, CanceledItemMapEntry>>
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

    const ordersWithStatus = orderSet.orders.map((order) => {
      const allItems = (order.items || []) as OrderLineItemWithVariant[];
      const orderId = (order as OrderDetailDTO & { id: string }).id;
      
      const activeItems = allItems.filter((item) => (item.quantity ?? 0) > 0);
      
      const canceledInfoForOrder = canceledItemsMap?.[orderId] || {};
      const canceledItems: CanceledOrderItem[] = [];
      
      for (const itemId in canceledInfoForOrder) {
        const canceledInfo = canceledInfoForOrder[itemId];
        
        if (canceledInfo && canceledInfo.canceled_quantity > 0) {
          const item = canceledInfo.item;
          
          if (!item) {
            continue;
          }
          
          const unitPrice = item.unit_price || 0;
          const canceledTotal = MathBN.mult(unitPrice, canceledInfo.canceled_quantity);
          
          canceledItems.push({
            id: itemId,
            variant_id: item.variant_id,
            thumbnail: item.thumbnail || null,
            title: item.title,
            variant_title: item.variant?.title || item.variant_title,
            product_handle: item.variant?.product?.handle || item.product?.handle,
            total: canceledTotal,
            original_total: canceledTotal,
            canceled_quantity: canceledInfo.canceled_quantity,
            is_partial_cancel: canceledInfo.current_quantity > 0,
            variant: item.variant ? {
              options: item.variant.options
            } : undefined
          });
        }
      }

      return {
        ...order,
        items: activeItems,
        canceled_items: canceledItems,
        fulfillment_status: getLastFulfillmentStatus(order),
        payment_status,
      };
    }) as OrderWithCanceledItems[];

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

export const getFulfillmentStatus = (orders: OrderWithCanceledItems[]) => {
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
