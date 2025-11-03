import { InviteWorkflowEvents } from "@medusajs/framework/utils";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

import adminUserInviteCreatedHandler from "./notification-admin-user-invite-created";

export default async function adminUserInviteResentHandler(
  input: SubscriberArgs<{ id: string }>
) {
  await adminUserInviteCreatedHandler(input);
}

export const config: SubscriberConfig = {
  event: InviteWorkflowEvents.RESENT,
  context: {
    subscriberId: "admin-user-invite-resend",
  },
};
