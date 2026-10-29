import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { SellerWorkflowEvents } from "../workflows/events"

export default async function telemetryFirstSellerApprovedHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_SELLER_APPROVED)
}

export const config: SubscriberConfig = {
  event: SellerWorkflowEvents.APPROVED,
  context: { subscriberId: "telemetry-first-seller-approved" },
}
