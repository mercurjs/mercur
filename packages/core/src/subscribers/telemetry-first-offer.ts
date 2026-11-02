import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { OfferWorkflowEvents } from "../workflows/events"

export default async function telemetryFirstOfferHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_OFFER)
}

export const config: SubscriberConfig = {
  event: OfferWorkflowEvents.CREATED,
  context: { subscriberId: "telemetry-first-offer" },
}
