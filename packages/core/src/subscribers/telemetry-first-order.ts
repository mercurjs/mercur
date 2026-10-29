import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { OrderGroupWorkflowEvents } from "../workflows/events"

export default async function telemetryFirstOrderHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_ORDER)
}

export const config: SubscriberConfig = {
  event: OrderGroupWorkflowEvents.CREATED,
  context: { subscriberId: "telemetry-first-order" },
}
