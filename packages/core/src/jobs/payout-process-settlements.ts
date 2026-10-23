import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { processSettlements } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutProcessSettlementsJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-process-settlements", PayoutJobTrigger.SCHEDULE, (ctx) => processSettlements(ctx))
}

export const config = {
  name: "payout-process-settlements",
  schedule: PAYOUT_JOB_SCHEDULES["payout-process-settlements"],
}
