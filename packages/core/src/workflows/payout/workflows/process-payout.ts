import { createWorkflow, when } from "@medusajs/framework/workflows-sdk"
import {
  PayoutWebhookResult,
  PayoutAccountStatus,
  PayoutStatus,
} from "@mercurjs/types"

import { updatePayoutAccountStep } from "../steps/update-payout-account"
import { updatePayoutStep } from "../steps/update-payout"

export interface ProcessPayoutWorkflowInput extends PayoutWebhookResult {}

export const processPayoutWorkflowId = "process-payout-workflow"

export const processPayoutWorkflow = createWorkflow(
  processPayoutWorkflowId,
  (input: ProcessPayoutWorkflowInput) => {
    when({ input }, ({ input }) => {
      return input.action === "account.activated" && !!input.data?.id
    }).then(() => {
      updatePayoutAccountStep({
        id: input.data!.id,
        status: PayoutAccountStatus.ACTIVE,
      }).config({ name: "activate-payout-account" })
    })

    when({ input }, ({ input }) => {
      return input.action === "account.restricted" && !!input.data?.id
    }).then(() => {
      updatePayoutAccountStep({
        id: input.data!.id,
        status: PayoutAccountStatus.RESTRICTED,
      }).config({ name: "restrict-payout-account" })
    })

    when({ input }, ({ input }) => {
      return input.action === "account.rejected" && !!input.data?.id
    }).then(() => {
      updatePayoutAccountStep({
        id: input.data!.id,
        status: PayoutAccountStatus.REJECTED,
      }).config({ name: "reject-payout-account" })
    })

    when({ input }, ({ input }) => {
      return input.action === "payout.processing" && !!input.data?.id
    }).then(() => {
      updatePayoutStep({
        id: input.data!.id,
        status: PayoutStatus.PROCESSING,
      }).config({ name: "processing-payout" })
    })

    when({ input }, ({ input }) => {
      return input.action === "payout.paid" && !!input.data?.id
    }).then(() => {
      updatePayoutStep({
        id: input.data!.id,
        status: PayoutStatus.PAID,
      }).config({ name: "paid-payout" })
    })

    when({ input }, ({ input }) => {
      return input.action === "payout.failed" && !!input.data?.id
    }).then(() => {
      updatePayoutStep({
        id: input.data!.id,
        status: PayoutStatus.FAILED,
      }).config({ name: "failed-payout" })
    })

    when({ input }, ({ input }) => {
      return input.action === "payout.canceled" && !!input.data?.id
    }).then(() => {
      updatePayoutStep({
        id: input.data!.id,
        status: PayoutStatus.CANCELED,
      }).config({ name: "canceled-payout" })
    })
  }
)
