import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import {
  MercurModules,
  PayoutStatus,
  PayoutWebhookResult,
  TransferStatus,
} from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { syncPayoutAccountWorkflow } from "./sync-payout-account"

export interface ProcessPayoutForWebhookWorkflowInput extends PayoutWebhookResult {
  provider_id: string
}

type Resolved = {
  account_id: string | null
  seller_id: string | null
  payout_id: string | null
  transfer_id: string | null
}

const resolveWebhookTargetStep = createStep(
  "resolve-payout-webhook-target",
  async (input: ProcessPayoutForWebhookWorkflowInput, { container }) => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const providerObjectId = input.data?.id

    const resolved: Resolved = {
      account_id: null,
      seller_id: null,
      payout_id: null,
      transfer_id: null,
    }

    if (!providerObjectId) {
      return new StepResponse(resolved)
    }

    if (input.action.startsWith("account.")) {
      const [account] = await service.listPayoutAccounts({
        provider_id: input.provider_id,
        provider_account_id: providerObjectId,
      })
      if (account) {
        resolved.account_id = account.id
        const {
          data: [link],
        } = await query.graph({
          entity: "seller_payout_account",
          fields: ["seller_id"],
          filters: { payout_account_id: account.id },
        })
        resolved.seller_id = link?.seller_id ?? null
      }
    } else if (input.action.startsWith("payout.")) {
      const [payout] = await service.listPayouts({ provider_payout_id: providerObjectId })
      resolved.payout_id = payout?.id ?? null
    } else if (input.action.startsWith("transfer.")) {
      const [transfer] = await service.listTransfers({ provider_transfer_id: providerObjectId })
      resolved.transfer_id = transfer?.id ?? null
    }

    return new StepResponse(resolved)
  }
)

type StatusCompensation = {
  payout?: { id: string; status: PayoutStatus; status_reason: string | null }
  transfer?: { id: string; status: TransferStatus; status_reason: string | null }
}

const applyWebhookStatusStep = createStep(
  "apply-payout-webhook-status",
  async (
    input: { action: string; reason?: string; payout_id: string | null; transfer_id: string | null },
    { container }
  ): Promise<StepResponse<void, StatusCompensation>> => {
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

    if (input.payout_id) {
      const statusByAction: Record<string, PayoutStatus> = {
        "payout.processing": PayoutStatus.PROCESSING,
        "payout.paid": PayoutStatus.PAID,
        "payout.failed": PayoutStatus.FAILED,
        "payout.canceled": PayoutStatus.CANCELED,
      }
      const status = statusByAction[input.action]
      if (status) {
        const previous = await service.retrievePayout(input.payout_id)
        await service.updatePayouts({
          id: input.payout_id,
          status,
          status_reason: status === PayoutStatus.FAILED ? (input.reason ?? previous.status_reason) : null,
        })
        await service.syncSettlementStatus(input.payout_id)
        return new StepResponse(void 0, { payout: { id: previous.id, status: previous.status, status_reason: previous.status_reason } } as StatusCompensation)
      }
    }

    if (input.transfer_id) {
      const statusByAction: Record<string, TransferStatus> = {
        "transfer.created": TransferStatus.CREATED,
        "transfer.failed": TransferStatus.FAILED,
      }
      const status = statusByAction[input.action]
      if (status) {
        const previous = await service.retrieveTransfer(input.transfer_id)
        await service.updateTransfers({
          id: input.transfer_id,
          status,
          status_reason: status === TransferStatus.FAILED ? (input.reason ?? previous.status_reason) : null,
        })
        return new StepResponse(void 0, { transfer: { id: previous.id, status: previous.status, status_reason: previous.status_reason } } as StatusCompensation)
      }
    }

    return new StepResponse(void 0, {} as StatusCompensation)
  },
  async (previous: StatusCompensation | undefined, { container }) => {
    if (!previous) return
    const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
    if (previous.payout) {
      await service.updatePayouts(previous.payout)
    }
    if (previous.transfer) {
      await service.updateTransfers(previous.transfer)
    }
  }
)

export const processPayoutForWebhookWorkflowId = "process-payout-for-webhook"

export const processPayoutForWebhookWorkflow = createWorkflow(
  processPayoutForWebhookWorkflowId,
  (input: ProcessPayoutForWebhookWorkflowInput) => {
    const target = resolveWebhookTargetStep(input)

    when({ target }, ({ target }) => !!target.account_id).then(() => {
      syncPayoutAccountWorkflow.runAsStep({
        input: {
          account_id: target.account_id as unknown as string,
          seller_id: target.seller_id,
        },
      })
    })

    const statusInput = transform({ input, target }, ({ input, target }) => ({
      action: input.action,
      reason: input.data?.status_reason,
      payout_id: target.payout_id,
      transfer_id: target.transfer_id,
    }))

    applyWebhookStatusStep(statusInput)

    return new WorkflowResponse(target)
  }
)
