import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { processReversals } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutProcessReversalsJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-process-reversals", PayoutJobTrigger.SCHEDULE, (ctx) => processReversals(ctx))
}

export const config = {
  name: "payout-process-reversals",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-reversals"],
}
