import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  OrderWorkflowEvents,
  ReturnStatus,
} from "@medusajs/framework/utils"
import { ReturnRequestStatus } from "@mercurjs/types"

import { markReturnRequestReturnedWorkflow } from "../workflows/return-request/workflows/mark-return-request-returned"

export default async function returnRequestReturnReceivedHandler({
  event,
  container,
}: SubscriberArgs<{ order_id: string; return_id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [orderReturn],
  } = await query.graph({
    entity: "return",
    fields: ["id", "status"],
    filters: { id: event.data.return_id },
  })

  if (orderReturn?.status !== ReturnStatus.RECEIVED) {
    return
  }

  const {
    data: [request],
  } = await query.graph({
    entity: "return_request",
    fields: ["id", "status"],
    filters: { return_id: event.data.return_id },
  })

  if (request?.status !== ReturnRequestStatus.AWAITING_RETURN) {
    return
  }

  await markReturnRequestReturnedWorkflow(container).run({
    input: { id: request.id },
  })
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.RETURN_RECEIVED,
  context: {
    subscriberId: "return-request-return-received-handler",
  },
}
