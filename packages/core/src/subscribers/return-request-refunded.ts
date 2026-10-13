import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { refreshOrderCommissionLinesWorkflow } from "../workflows/commission/workflows/refresh-order-commission-lines"
import { ReturnRequestWorkflowEvents } from "../workflows/return-request/events"

// Requests accepted without a physical return never emit RETURN_RECEIVED, so the
// commission refresh that order-edit-confirmed.ts runs on it has to happen here.
export default async function returnRequestRefundedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; order_id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request],
  } = await query.graph({
    entity: "return_request",
    fields: ["id", "return_required"],
    filters: { id: event.data.id },
  })

  if (request?.return_required !== false) {
    return
  }

  await refreshOrderCommissionLinesWorkflow(container).run({
    input: { order_ids: [event.data.order_id] },
  })
}

export const config: SubscriberConfig = {
  event: ReturnRequestWorkflowEvents.REFUNDED,
  context: {
    subscriberId: "return-request-refunded-handler",
  },
}
