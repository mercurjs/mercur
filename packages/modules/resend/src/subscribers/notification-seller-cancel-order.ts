import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import { ResendNotificationTemplates } from "../providers/resend";

import { Hosts, buildHostAddress, fetchStoreData } from "@mercurjs/framework";

export default async function sellerCancelOrderHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "email",
      "display_id",
      "items.*",
      "customer.first_name",
      "customer.last_name",
      "seller.*",
    ],
    filters: {
      id: event.data.id,
    },
  });

  if (!order) {
    console.error("Order not found:", event.data.id);
    return;
  }

  const storeData = await fetchStoreData(container);

  await notificationService.createNotifications({
    to: order.seller.email,
    channel: "email",
    template: ResendNotificationTemplates.SELLER_CANCELED_ORDER,
    content: {
      subject: `Your order #${order.display_id} has been canceled`,
    },
    data: {
      data: {
        order: {
          id: order.id,
          display_id: order.display_id,
          item: order.items,
        },
        order_address: buildHostAddress(
          Hosts.VENDOR_PANEL,
          `/orders/${order.id}`
        ).toString(),
        store_name: storeData.store_name,
        storefront_url: storeData.storefront_url,
      },
    },
  });
}

export const config: SubscriberConfig = {
  event: "order.canceled",
  context: {
    subscriberId: "notification-seller-cancel-order-resend",
  },
};
