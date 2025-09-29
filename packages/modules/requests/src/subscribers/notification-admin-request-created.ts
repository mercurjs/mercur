import { Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

import { HumanizeTypes, RequestDTO, RequestUpdated } from "@mercurjs/framework";

export default async function requestCreatedAdminNotifyHandler({
  event,
  container,
}: SubscriberArgs<RequestDTO>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const {
    data: { type },
  } = event;

  await notificationService.createNotifications({
    to: "",
    channel: "feed",
    template: "admin-ui",
    content: {
      subject: `New Request Created`,
    },
    data: {
      title: `New ${HumanizeTypes[type]}`,
      description: "You have received a new request from a seller 🔔",
      redirect: "/admin/requests",
    },
  });
}

export const config: SubscriberConfig = {
  event: RequestUpdated.CREATED,
  context: {
    subscriberId: "request-created-admin-notify-handler",
  },
};
