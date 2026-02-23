import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  ChangeActionType,
  ContainerRegistrationKeys,
  Modules,
  OrderChangeStatus,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils";

import { ResendNotificationTemplates } from "../providers/resend";

import { Hosts, buildHostAddress, fetchStoreData } from "@mercurjs/framework";

export default async function orderTransferRequestedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_change_id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const storeData = await fetchStoreData(container);

  try {
    const {
      data: [orderChange],
    } = await query.graph({
      entity: "order_change",
      fields: [
        "id",
        "actions.id",
        "actions.action",
        "actions.details",
        "actions.reference",
        "actions.reference_id",
      ],
      filters: {
        id: event.data.order_change_id,
        status: [OrderChangeStatus.REQUESTED],
      },
    });

    if (!orderChange) {
      return;
    }

    const transferAction = orderChange.actions.find(
      (a) => a.action === ChangeActionType.TRANSFER_CUSTOMER
    );

    if (!transferAction) {
      return;
    }

    const token = (transferAction.details as Record<string, unknown>)
      ?.token as string;
    const newCustomerId = transferAction.reference_id;

    if (!token || !newCustomerId) {
      return;
    }

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: newCustomerId },
    });

    if (!customer) {
      return;
    }

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "*",
        "items.*",
        "shipping_address.*",
        "shipping_methods.*",
        "summary.*",
      ],
      filters: { id: event.data.id },
    });

    if (!order) {
      return;
    }

    const acceptUrl = buildHostAddress(
      Hosts.STOREFRONT,
      `/user/orders/${order.id}/transfer/accept`
    );
    acceptUrl.searchParams.set("token", token);

    const declineUrl = buildHostAddress(
      Hosts.STOREFRONT,
      `/user/orders/${order.id}/transfer/decline`
    );
    declineUrl.searchParams.set("token", token);

    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: ResendNotificationTemplates.BUYER_ORDER_TRANSFER_REQUEST,
      content: {
        subject: `Order Transfer Request - #${order.display_id}`,
      },
      data: {
        data: {
          user_name: customer.first_name || "Customer",
          order: {
            ...order,
            display_id: order.display_id,
            total: order.summary?.current_order_total || 0,
          },
          accept_url: acceptUrl.toString(),
          decline_url: declineUrl.toString(),
          store_name: storeData.store_name,
          storefront_url: storeData.storefront_url,
        },
      },
    });
  } catch (error) {
    console.error(
      `Error processing order transfer notification for order ${event.data.id}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.TRANSFER_REQUESTED,
  context: {
    subscriberId: "order-transfer-requested-handler-resend",
  },
};
