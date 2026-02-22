import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { AuthWorkflowEvents, Modules } from "@medusajs/framework/utils";

import { ResendNotificationTemplates } from "../providers/resend";

import { actorTypeToHost, buildResetPasswordUrl, fetchStoreData } from "@mercurjs/framework";

export default async function passwordResetHandler({
  event,
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);

  const hostType = actorTypeToHost[event.data.actor_type];
  if (!hostType) {
    return;
  }

  const storeData = await fetchStoreData(container);

  await notificationService.createNotifications({
    to: event.data.entity_id,
    channel: "email",
    template: ResendNotificationTemplates.FORGOT_PASSWORD,
    content: {
      subject: `${storeData.store_name} - Reset password request`,
    },
    data: {
      data: {
        url: buildResetPasswordUrl(hostType, event.data.token).toString(),
        store_name: storeData.store_name,
        storefront_url: storeData.storefront_url,
      },
    },
  });
}

export const config: SubscriberConfig = {
  event: AuthWorkflowEvents.PASSWORD_RESET,
  context: {
    subscriberId: "password-reset-handler-resend",
  },
};
