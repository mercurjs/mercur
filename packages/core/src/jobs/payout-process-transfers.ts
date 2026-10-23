import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { processTransfers } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutProcessTransfersJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-process-transfers", PayoutJobTrigger.SCHEDULE, (ctx) => processTransfers(ctx))
}

export const config = {
  name: "payout-process-transfers",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-transfers"],
}
