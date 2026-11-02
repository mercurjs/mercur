import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PayoutModuleEvents } from "@mercurjs/types"

import { StripeConnectorEvents } from "../types/common"
import { resolveConnector } from "../utils/payout-module"
import {
  FailedOperation,
  notifyOperationFailedWorkflow,
} from "../workflows/notifications/workflows/notify-operation-failed"

const OPERATION_BY_EVENT: Record<string, FailedOperation> = {
  [PayoutModuleEvents.PAYOUT_FAILED]: "payout",
  [PayoutModuleEvents.PAYOUT_REVERSAL_FAILED]: "payout_reversal",
  [StripeConnectorEvents.SETTLEMENT_PAYOUT_FAILED]: "settlement",
}

export default async function stripeOperatorNotificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const operation = OPERATION_BY_EVENT[event.name]
  if (!operation || !event.data?.id || !resolveConnector(container).getOptions().notifications.url) {
    return
  }

  await notifyOperationFailedWorkflow(container).run({ input: { operation, id: event.data.id } })
}

export const config: SubscriberConfig = {
  event: Object.keys(OPERATION_BY_EVENT),
  context: { subscriberId: "stripe-connector-operator-notification" },
}
