import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { MemberInviteWorkflowEvents } from "../workflows/events"

export default async function telemetryFirstMemberInvitedHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_MEMBER_INVITED)
}

export const config: SubscriberConfig = {
  event: MemberInviteWorkflowEvents.CREATED,
  context: { subscriberId: "telemetry-first-member-invited" },
}
