import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { OrderUpdateEvents } from '@mercurjs/framework';

export default async function sellerOrderShippingAddressUpdatedHandler({
  event,
  container
}: SubscriberArgs<{ order_id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [order]
  } = await query.graph({
    entity: 'order',
    fields: ['seller.id'],
    filters: {
      id: event.data.order_id
    }
  });

  const sellerId = order?.seller?.id;

  if (!sellerId) {
    return;
  }

  await notificationService.createNotifications([
    {
      to: sellerId,
      channel: 'seller_feed',
      template: 'seller_order_shipping_address_updated_notification',
      data: {
        order_id: event.data.order_id
      }
    }
  ]);
}

export const config: SubscriberConfig = {
  event: OrderUpdateEvents.SHIPPING_ADDRESS_UPDATED,
  context: {
    subscriberId: 'seller-order-shipping-address-updated-handler'
  }
};
