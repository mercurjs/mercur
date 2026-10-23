import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { syncOnboarding } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutSyncOnboardingJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-sync-onboarding", PayoutJobTrigger.SCHEDULE, (ctx) => syncOnboarding(ctx))
}

export const config = {
  name: "payout-sync-onboarding",
  schedule: PAYOUT_JOB_SCHEDULES["payout-sync-onboarding"],
}
