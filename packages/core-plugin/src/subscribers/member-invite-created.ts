import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { MemberInviteWorkflowEvents } from "../workflows/events"

type MemberInviteCreatedData = {
  id: string
  token: string
  expires_at: string
}[]

export default async function memberInviteCreatedHandler({
  event,
  container,
}: SubscriberArgs<MemberInviteCreatedData>) {

  console.log(event.data)
}


export const config: SubscriberConfig = {
  event: MemberInviteWorkflowEvents.CREATED,
  context: {
    subscriberId: "member-invite-created-handler",
  },
}
