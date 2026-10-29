import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { SellerWorkflowEvents } from "../workflows/events"

export default async function telemetryFirstSellerHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_SELLER)
}

export const config: SubscriberConfig = {
  event: SellerWorkflowEvents.CREATED,
  context: { subscriberId: "telemetry-first-seller" },
}
