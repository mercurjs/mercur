import { MedusaContainer } from "@medusajs/framework/types"

import { PayoutJobName } from "../types/common"
import { JobStats } from "../utils/run-job"
import { alertFailedOperationsWorkflow } from "./alerts/alert-failed-operations"
import { processCapturesWorkflow } from "./captures/workflows/process-captures"
import { monitorKycWorkflow } from "./kyc/monitor-kyc"
import { syncOnboardingWorkflow } from "./onboarding/sync-onboarding"
import { processPayoutsWorkflow } from "./payouts/workflows/process-payouts"
import { processReversalsWorkflow } from "./reversals/workflows/process-reversals"
import { processSettlementsWorkflow } from "./settlements/workflows/process-settlements"

export type JobScope = { seller_id?: string; order_id?: string; order_group_id?: string }

/** The workflow each scheduled job runs, narrowed to one seller, order or order group when given. */
export const jobWorkflow = (
  job: PayoutJobName,
  container: MedusaContainer,
  scope: JobScope = {}
): (() => Promise<JobStats>) => {
  const workflows: Record<PayoutJobName, () => Promise<JobStats>> = {
    "payout-sync-onboarding": async () =>
      (await syncOnboardingWorkflow(container).run({
        input: { seller_ids: scope.seller_id ? [scope.seller_id] : undefined },
      })).result,
    "payout-validate-captures": async () =>
      (await processCapturesWorkflow(container).run({ input: { order_group_id: scope.order_group_id } })).result,
    "payout-process-transfers": async () =>
      (await processPayoutsWorkflow(container).run({
        input: { order_ids: scope.order_id ? [scope.order_id] : undefined },
      })).result,
    "payout-process-reversals": async () =>
      (await processReversalsWorkflow(container).run({
        input: { order_ids: scope.order_id ? [scope.order_id] : undefined },
      })).result,
    "payout-process-settlements": async () =>
      (await processSettlementsWorkflow(container).run({ input: { seller_id: scope.seller_id } })).result,
    "payout-alert-failed-operations": async () => (await alertFailedOperationsWorkflow(container).run()).result,
    "payout-monitor-kyc": async () => (await monitorKycWorkflow(container).run()).result,
  }
  return workflows[job]
}
