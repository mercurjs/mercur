import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { monitorKyc } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutMonitorKycJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-monitor-kyc", PayoutJobTrigger.SCHEDULE, (ctx) => monitorKyc(ctx))
}

export const config = {
  name: "payout-monitor-kyc",
  schedule: PAYOUT_JOB_SCHEDULES["payout-monitor-kyc"],
}
