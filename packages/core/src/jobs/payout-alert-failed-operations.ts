import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { alertFailedOperations } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutAlertFailedOperationsJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-alert-failed-operations", PayoutJobTrigger.SCHEDULE, (ctx) => alertFailedOperations(ctx))
}

export const config = {
  name: "payout-alert-failed-operations",
  schedule: PAYOUT_JOB_SCHEDULES["payout-alert-failed-operations"],
}
