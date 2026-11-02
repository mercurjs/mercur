import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { PayoutModuleEvents } from "@mercurjs/types"

import { queueAwaitingAccountPayoutsWorkflow } from "../workflows/payouts/workflows/queue-awaiting-account-payouts"

export default async function stripePayoutAccountUpdatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await queueAwaitingAccountPayoutsWorkflow(container).run({ input: { id: event.data.id } })
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.ACCOUNT_UPDATED,
  context: { subscriberId: "stripe-connector-payout-account-updated" },
}
