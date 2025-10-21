import { InviteWorkflowEvents, Modules } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

import { Hosts, buildHostAddress } from "@mercurjs/framework";
import { ResendNotificationTemplates } from "../providers/resend";

export default async function adminUserInviteCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION);
  const userService = container.resolve(Modules.USER);

  const invites = await userService.listInvites({
    id: event.data.id,
  });

  const notifications = invites.map((invite) => ({
    to: invite.email,
    channel: "email",
    template: ResendNotificationTemplates.NEW_ADMIN_INVITATION,
    content: {
      subject: "Admin requested to join the platform",
    },
    data: {
      data: {
        url: buildHostAddress(
          Hosts.BACKEND,
          `/app/invite?token=${invite.token}`
        ).toString(),
      },
    },
  }));

  await notificationService.createNotifications(notifications);
}

export const config: SubscriberConfig = {
  event: InviteWorkflowEvents.CREATED,
  context: {
    subscriberId: "admin-user-invite-created",
  },
};
