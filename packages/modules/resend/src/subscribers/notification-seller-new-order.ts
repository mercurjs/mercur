import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils";

import { ResendNotificationTemplates } from "../providers/resend";
import { fetchStoreData } from "@mercurjs/framework";

export default async function sellerNewOrderHandler({
  event,
  container,
}: SubscriberArgs<{ order_ids: string[] }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const storeData = await fetchStoreData(container);

  for (const orderId of event.data.order_ids) {
    try {
      const {
        data: [order],
      } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "items.*",
          "seller.email",
          "seller.name",
          "seller.id",
          "customer.first_name",
          "customer.last_name",
        ],
        filters: {
          id: orderId,
        },
      });

      if (!order) {
        console.error("Order not found:", orderId);
        continue;
      }

      const sellerEmail = order.seller?.email;
      if (!sellerEmail) {
        console.error("Seller email not found for order:", order.id);
        continue;
      }

      const customer_name = `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`;
      await notificationService.createNotifications([
        {
          to: order.seller?.id,
          channel: "seller_feed",
          template: "seller_new_order_notification",
          data: {
            order_id: order.id,
            customer_name,
          },
        },
        {
          to: sellerEmail,
          channel: "email",
          template: ResendNotificationTemplates.SELLER_NEW_ORDER,
          content: {
            subject: `New order #${order.display_id} received`,
          },
          data: {
            data: {
              order_id: order.id,
              order,
              customer_name,
              seller_name: order.seller?.name || "",
              store_name: storeData.store_name,
              storefront_url: storeData.storefront_url,
            },
          },
        },
      ]);
    } catch (error) {
      console.error(
        `Error processing seller notification for order ${orderId}:`,
        error
      );
    }
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
  context: {
    subscriberId: "seller-new-order-handler-resend",
  },
};
