import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

import {
  RequestDTO,
  SellerAccountRequestUpdatedEvent,
  fetchStoreData,
} from "@mercurjs/framework";
import { ResendNotificationTemplates } from "../providers/resend";

export default async function sellerRequestRejectedHandler({
  event,
  container,
}: SubscriberArgs<RequestDTO>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const requestData = event.data.data as {
    provider_identity_id: string;
    member: { name: string };
  };

  const storeData = await fetchStoreData(container);

  await notificationService.createNotifications({
    to: requestData.provider_identity_id,
    channel: "email",
    template: ResendNotificationTemplates.SELLER_ACCOUNT_UPDATES_REJECTION,
    content: {
      subject: `${storeData.store_name} - Seller account rejected!`,
    },
    data: {
      data: {
        store_name: storeData.store_name,
        storefront_url: storeData.storefront_url,
      },
    },
  });
}

export const config: SubscriberConfig = {
  event: SellerAccountRequestUpdatedEvent.REJECTED,
  context: {
    subscriberId: "seller-account-request-rejected-handler-resend",
  },
};
