import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { IPayoutModuleService, MercurModules, PayoutAccountStatus, PayoutModuleEvents } from "@mercurjs/types"

import { recordMilestone, TelemetryMilestones } from "../utils/telemetry/milestones"

export default async function telemetryFirstPayoutAccountHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const payoutService = container.resolve<IPayoutModuleService>(MercurModules.PAYOUT)
    const account = await payoutService.retrievePayoutAccount(event.data.id)
    if (account.status !== PayoutAccountStatus.ACTIVE) {
      return
    }
  } catch {
    return
  }

  await recordMilestone(container, TelemetryMilestones.FIRST_PAYOUT_ACCOUNT)
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.ACCOUNT_UPDATED,
  context: { subscriberId: "telemetry-first-payout-account" },
}
