import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  FulfillmentWorkflowEvents,
  Modules,
} from "@medusajs/framework/utils";

export default async function sellerFulfillmentDeliveredHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: [fulfillment] } = await query.graph({
    entity: 'fulfillment',
    fields: ['order.id', 'order.seller.id'],
    filters: {
      id: event.data.id
    }
  })

  const orderId = fulfillment?.order?.id;
  const sellerId = fulfillment?.order?.seller?.id;

  if (!orderId || !sellerId) {
    return;
  }

  await notificationService.createNotifications([
    {
      to: sellerId,
      channel: "seller_feed",
      template: "seller_fulfillment_delivered_notification",
      data: {
        order_id: orderId,
      },
    },
  ]);
}

export const config: SubscriberConfig = {
  event: FulfillmentWorkflowEvents.DELIVERY_CREATED,
  context: {
    subscriberId: "seller-fulfillment-delivered-handler",
  },
};
