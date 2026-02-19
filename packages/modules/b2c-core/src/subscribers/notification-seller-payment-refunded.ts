import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  PaymentEvents,
} from "@medusajs/framework/utils";

export default async function sellerPaymentRefundedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: [payment] } = await query.graph({
    entity: 'payment',
    fields: ['order.id', 'order.seller.id'],
    filters: {
      id: event.data.id
    }
  })

  const orderId = payment?.order?.id;
  const sellerId = payment?.order?.seller?.id;

  if (!orderId || !sellerId) {
    return;
  }

  await notificationService.createNotifications([
    {
      to: sellerId,
      channel: "seller_feed",
      template: "seller_payment_refunded_notification",
      data: {
        order_id: orderId,
      },
    },
  ]);
}

export const config: SubscriberConfig = {
  event: PaymentEvents.REFUNDED,
  context: {
    subscriberId: "seller-payment-refunded-handler",
  },
};
