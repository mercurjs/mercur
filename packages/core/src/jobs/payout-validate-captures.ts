import { MedusaContainer } from "@medusajs/framework/types"
import { PAYOUT_JOB_SCHEDULES, PayoutJobTrigger } from "@mercurjs/types"

import { validateCaptures } from "../workflows/payout/pipeline"
import { runPayoutJob } from "../workflows/payout/utils/run-payout-job"

export default async function payoutValidateCapturesJob(container: MedusaContainer) {
  await runPayoutJob(container, "payout-validate-captures", PayoutJobTrigger.SCHEDULE, (ctx) => validateCaptures(ctx))
}

export const config = {
  name: "payout-validate-captures",
  schedule: PAYOUT_JOB_SCHEDULES["payout-validate-captures"],
}
