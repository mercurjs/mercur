import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PayoutModuleEvents, TransferStatus, TransferType } from "@mercurjs/types"

import { dispatchTransferStep } from "../steps/dispatch-transfer"

export type ProcessTransferWorkflowInput = {
  transfer_id: string
}

export const processTransferWorkflowId = "process-transfer"

export const processTransferWorkflow = createWorkflow(
  processTransferWorkflowId,
  function (input: ProcessTransferWorkflowInput) {
    const transfer = dispatchTransferStep({ transfer_id: input.transfer_id })

    const failure = transform({ transfer }, ({ transfer }) => ({
      failed: transfer.status === TransferStatus.FAILED,
      name:
        transfer.type === TransferType.REFUND_REVERSAL
          ? PayoutModuleEvents.TRANSFER_REVERSAL_FAILED
          : PayoutModuleEvents.TRANSFER_FAILED,
      data: {
        id: transfer.id,
        type: transfer.type,
        account_id: transfer.account_id,
        order_id: transfer.order_id,
        refund_id: transfer.refund_id,
        amount: transfer.amount,
        currency_code: transfer.currency_code,
        status: transfer.status,
        status_reason: transfer.status_reason,
        provider_transfer_id: transfer.provider_transfer_id,
      },
    }))

    when(failure, ({ failed }) => failed).then(() => {
      emitEventStep({ eventName: failure.name, data: failure.data })
    })

    return new WorkflowResponse(transfer)
  }
)
