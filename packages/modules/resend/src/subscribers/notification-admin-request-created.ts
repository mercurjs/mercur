import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

import {
  RequestDTO,
  RequestUpdated,
  fetchAdminEmails,
  Hosts,
  buildHostAddress,
  fetchStoreData,
} from "@mercurjs/framework";
import { ResendNotificationTemplates } from "../providers/resend";

export default async function requestCreatedAdminNotifyHandler({
  event,
  container,
}: SubscriberArgs<RequestDTO>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const {
    data: { type, data },
  } = event;

  if (type === "seller") {
    const admins = await fetchAdminEmails(container);
    const storeData = await fetchStoreData(container);
    const notifications = admins.map((email) => ({
      to: email,
      channel: "email",
      template: ResendNotificationTemplates.ADMIN_SELLER_REQUEST_CREATED,
      content: {
        subject: "Seller requested to join the platform",
      },
      data: {
        data: {
          seller_name: (data as any).seller.name || "",
          request_address: buildHostAddress(
            Hosts.BACKEND,
            `/requests/seller`
          ).toString(),
          store_name: storeData.store_name,
          storefront_url: storeData.storefront_url,
        },
      },
    }));

    await notificationService.createNotifications(notifications);
  }
}

export const config: SubscriberConfig = {
  event: RequestUpdated.CREATED,
  context: {
    subscriberId: "request-created-admin-notify-handler-resend",
  },
};
