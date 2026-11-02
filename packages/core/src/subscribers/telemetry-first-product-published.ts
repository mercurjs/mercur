import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"
import { ProductWorkflowEvents } from "../workflows/product/events"

export default async function telemetryFirstProductPublishedHandler({ container }: SubscriberArgs<unknown>) {
  await recordMilestone(container, TelemetryMilestones.FIRST_PRODUCT_PUBLISHED)
}

export const config: SubscriberConfig = {
  event: ProductWorkflowEvents.PUBLISHED,
  context: { subscriberId: "telemetry-first-product-published" },
}
