import { MedusaContainer } from "@medusajs/framework/types"

import { jobHandler } from "../pipeline/jobs"
import { JobTrigger, PAYOUT_JOB_SCHEDULES } from "../types/common"
import { runJob } from "../utils/run-job"

export default async function payoutSyncOnboardingJob(container: MedusaContainer) {
  await runJob(container, "payout-sync-onboarding", JobTrigger.SCHEDULE, jobHandler("payout-sync-onboarding"))
}

export const config = {
  name: "payout-sync-onboarding",
  schedule: PAYOUT_JOB_SCHEDULES["payout-sync-onboarding"],
}
