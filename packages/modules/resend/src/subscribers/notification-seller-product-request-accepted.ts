import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

import {
  ConfigurationRuleType,
  ProductRequestUpdatedEvent,
} from "@mercurjs/framework";
import { ResendNotificationTemplates } from "../providers/resend";

export default async function sellerProductRequestAcceptedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [productRequest],
  } = await query.graph({
    entity: "request",
    fields: ["*"],
    filters: {
      id: event.data.id,
    },
  });

  if (!productRequest || productRequest.type !== "product") {
    return;
  }

  if (productRequest.reviewer_id === "system") {
    return;
  }

  const {
    data: [member],
  } = await query.graph({
    entity: "member",
    fields: ["*"],
    filters: {
      id: productRequest.submitter_id,
    },
  });

  if (!member || !member.email) {
    return;
  }

  await notificationService.createNotifications({
    to: member.email,
    channel: "email",
    template: ResendNotificationTemplates.SELLER_PRODUCT_APPROVED,
    content: {
      subject: "Mercur - Product approved!",
    },
    data: { data: { product_title: productRequest.data.title } },
  });
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: "seller-product-request-accepted-handler-resend",
  },
};
