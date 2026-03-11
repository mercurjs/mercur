import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError
} from '@medusajs/framework/utils';
import {
  StepResponse,
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  parallelize,
  transform
} from '@medusajs/framework/workflows-sdk';
import {
  beginOrderEditOrderWorkflow,
  confirmOrderEditRequestWorkflow,
  emitEventStep,
  orderEditUpdateItemQuantityWorkflow
} from '@medusajs/medusa/core-flows';

import { OrderWorkflowEvents } from '@mercurjs/framework';
import { createPayoutReversalStep } from '../../payout/steps';
import { removeShippingMethodsStep } from '../steps';
import { partialPaymentRefundWorkflow } from '../../split-order-payment/workflows/partial-payment-refund';

export type CancelOrderItemsInput = {
  order_id: string;
  items: {
    id: string;
    quantity: number;
  }[];
  canceled_by?: string;
  no_notification?: boolean;
};

export const validateCancelItemsStep = createStep(
  'validate-cancel-items',
  async (
    {
      order_id,
      items
    }: {
      order_id: string;
      items: { id: string; quantity: number }[];
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: orders } = await query.graph({
      entity: 'order',
      fields: ['id', 'items.*'],
      filters: { id: order_id }
    });

    if (!orders || orders.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id ${order_id} not found`
      );
    }

    const order = orders[0] as any;

    for (const cancelItem of items) {
      const orderItem = order.items?.find(
        (item: any) => item.id === cancelItem.id
      );

      if (!orderItem) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Item with id ${cancelItem.id} not found in order ${order_id}`
        );
      }

      if (cancelItem.quantity > orderItem.quantity) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cannot cancel ${cancelItem.quantity} of item ${cancelItem.id}. Only ${orderItem.quantity} available in order.`
        );
      }

      if (orderItem.detail?.fulfilled_quantity > 0) {
        const availableToCancel =
          orderItem.quantity - orderItem.detail.fulfilled_quantity;
        if (cancelItem.quantity > availableToCancel) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Cannot cancel ${cancelItem.quantity} of item ${cancelItem.id}. Only ${availableToCancel} available (${orderItem.detail.fulfilled_quantity} already fulfilled).`
          );
        }
      }
    }

    return new StepResponse(void 0);
  }
);

export const calculateRefundAmountStep = createStep(
  'calculate-refund-amount-for-cancel',
  async (
    {
      order_id,
      items
    }: {
      order_id: string;
      items: { id: string; quantity: number }[];
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [order]
    } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'items.*',
        'shipping_methods.*',
        'split_order_payment.*',
        'payouts.*',
        'currency_code'
      ],
      filters: { id: order_id }
    });

    let refundAmount = MathBN.convert(0);
    const itemsWithNewQuantity: Array<{
      id: string;
      current_quantity: number;
      new_quantity: number;
    }> = [];

    for (const itemToCancel of items) {
      const orderItem = order.items?.find((i: any) => i.id === itemToCancel.id);
      if (!orderItem) continue;

      const newQuantity = orderItem.quantity - itemToCancel.quantity;
      itemsWithNewQuantity.push({
        id: itemToCancel.id,
        current_quantity: orderItem.quantity,
        new_quantity: Math.max(0, newQuantity)
      });

      const itemTotal = MathBN.mult(
        orderItem.unit_price || 0,
        itemToCancel.quantity
      );

      const itemTax = orderItem.tax_total
        ? MathBN.mult(
            MathBN.div(orderItem.tax_total, orderItem.quantity),
            itemToCancel.quantity
          )
        : 0;

      refundAmount = MathBN.sum(refundAmount, MathBN.sum(itemTotal, itemTax));
    }

    const itemsAfterCancel =
      order.items?.map((orderItem: any) => {
        const cancelRequest = items.find((i) => i.id === orderItem.id);
        if (cancelRequest) {
          const newQty = orderItem.quantity - cancelRequest.quantity;
          return { id: orderItem.id, quantity: Math.max(0, newQty) };
        }
        return { id: orderItem.id, quantity: orderItem.quantity };
      }) || [];

    const allItemsWillBeCanceled = itemsAfterCancel.every(
      (item: any) => item.quantity === 0
    );

    if (allItemsWillBeCanceled) {
      for (const shippingMethod of order.shipping_methods || []) {
        const shippingAmount = shippingMethod.amount || 0;
        const shippingTax = shippingMethod.tax_total || 0;
        refundAmount = MathBN.sum(
          refundAmount,
          MathBN.sum(shippingAmount, shippingTax)
        );
      }
    }

    return new StepResponse({
      refund_amount: refundAmount,
      split_payment_id: order.split_order_payment?.id,
      payout_id: order.payouts?.[0]?.id || null,
      currency_code: order.currency_code,
      items_with_new_quantity: itemsWithNewQuantity,
      all_items_canceled: allItemsWillBeCanceled
    });
  }
);

export const cancelOrderItemsWorkflow = createWorkflow(
  'cancel-order-items',
  (input: WorkflowData<CancelOrderItemsInput>) => {
    validateCancelItemsStep({
      order_id: input.order_id,
      items: input.items
    });

    beginOrderEditOrderWorkflow.runAsStep({
      input: {
        order_id: input.order_id
      }
    });

    const refundData = calculateRefundAmountStep({
      order_id: input.order_id,
      items: input.items
    });

    const itemUpdates = transform({ refundData }, ({ refundData }) =>
      refundData.items_with_new_quantity.map((item: any) => ({
        id: item.id,
        quantity: item.new_quantity
      }))
    );

    orderEditUpdateItemQuantityWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        items: itemUpdates
      }
    });

    removeShippingMethodsStep({
      order_id: input.order_id,
      should_remove: transform(
        { refundData },
        ({ refundData }) => refundData.all_items_canceled
      )
    });

    confirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        confirmed_by: input.canceled_by
      }
    });

    parallelize(
      partialPaymentRefundWorkflow.runAsStep({
        input: transform({ refundData }, ({ refundData }) => ({
          id: refundData.split_payment_id,
          amount: Number(refundData.refund_amount)
        }))
      }),

      createPayoutReversalStep(
        transform({ refundData }, ({ refundData }) => ({
          payout_id: refundData.payout_id,
          amount: refundData.refund_amount,
          currency_code: refundData.currency_code
        }))
      )
    );

    emitEventStep({
      eventName: OrderWorkflowEvents.ITEMS_CANCELED,
      data: {
        id: input.order_id,
        items: input.items
      }
    });

    return new WorkflowResponse(
      transform({ input, refundData }, ({ input, refundData }) => ({
        order_id: input.order_id,
        canceled_items: input.items,
        refund_amount: refundData.refund_amount
      }))
    );
  }
);
