import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { PayoutAccountStatus } from "@mercurjs/types"

import { setCheckpointsStep } from "../../common/steps"
import { awaitingAccountCheckpoint } from "../utils/payout-orders"

export type QueueAwaitingAccountPayoutsWorkflowInput = {
  id: string
}

export const queueAwaitingAccountPayoutsWorkflowId = "queue-stripe-awaiting-account-payouts"

/**
 * Core creates no payout for an order whose seller has no payout account yet.
 * Once the account is active, the seller's orders are queued so the transfers
 * job pays the ones that still have no payout.
 */
export const queueAwaitingAccountPayoutsWorkflow = createWorkflow(
  queueAwaitingAccountPayoutsWorkflowId,
  function (input: QueueAwaitingAccountPayoutsWorkflowInput) {
    const { data: accounts } = useQueryGraphStep({
      entity: "payout_account",
      fields: ["id", "status", "seller.id"],
      filters: { id: input.id },
    }).config({ name: "awaiting-account-query" })

    const sellerId = transform({ accounts }, ({ accounts }) => {
      const account = accounts[0] as { status?: string; seller?: { id: string } | null } | undefined
      return account?.status === PayoutAccountStatus.ACTIVE ? account.seller?.id ?? null : null
    })

    when("account-ready-for-payouts", { sellerId }, ({ sellerId }) => !!sellerId).then(() => {
      setCheckpointsStep(
        transform({ sellerId }, ({ sellerId }) => [{ key: awaitingAccountCheckpoint(sellerId ?? ""), value: "" }])
      )
    })

    return new WorkflowResponse(sellerId)
  }
)
