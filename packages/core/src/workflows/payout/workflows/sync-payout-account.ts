import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents } from "@mercurjs/types"

import { refreshLoginLinkStep, syncPayoutAccountStep } from "../steps/sync-payout-account"

export type SyncPayoutAccountWorkflowInput = {
  account_id: string
  seller_id?: string | null
}

export const syncPayoutAccountWorkflowId = "sync-payout-account"

/**
 * Pull the account from the
 * provider, refresh the flags and KYC status, swap the onboarding link for a
 * login link once details are submitted, and tell the operator.
 */
export const syncPayoutAccountWorkflow = createWorkflow(
  syncPayoutAccountWorkflowId,
  function (input: SyncPayoutAccountWorkflowInput) {
    const account = syncPayoutAccountStep({ account_id: input.account_id })

    when({ account }, ({ account }) => account.details_submitted).then(() => {
      refreshLoginLinkStep({ account_id: input.account_id })
    })

    const eventData = transform({ account, input }, ({ account, input }) => ({
      id: account.id,
      seller_id: input.seller_id ?? null,
      external_id: account.external_id,
      status: account.status,
      kyc_status: account.kyc_status,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      disabled_reason: account.disabled_reason,
    }))

    emitEventStep({ eventName: PayoutModuleEvents.ACCOUNT_UPDATED, data: eventData })

    return new WorkflowResponse(account)
  }
)
