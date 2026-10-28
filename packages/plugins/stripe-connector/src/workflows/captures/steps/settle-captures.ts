import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN, MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { capturePaymentWorkflow } from "@mercurjs/core/workflows"

import { CaptureDTO, CaptureStatus } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { cancelCapturePaymentWorkflow } from "../workflows/cancel-capture-payment"
import { CaptureAction, actionFor } from "../utils/capture-action"

export type { CaptureAction }

const REASON_MAX_LENGTH = 1024

const reasonOf = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, REASON_MAX_LENGTH)

/**
 * Captures the decided amount of the cart payment, or releases it. The
 * outcome is written on the capture row; a provider error marks it failed
 * so the next run retries it.
 */
export async function settleCapture(
  container: MedusaContainer,
  row: CaptureDTO,
  action: CaptureAction
): Promise<CaptureDTO> {
  const connector = resolveConnector(container)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    if (action === "capture") {
      await capturePaymentWorkflow(container).run({
        input: { payment_id: row.payment_id, amount: row.capturable_amount },
      })
    } else {
      await cancelCapturePaymentWorkflow(container).run({
        input: { payment_id: row.payment_id },
      })
    }
    return (await connector.updateStripeCaptures({
      id: row.id,
      status: action === "capture" ? CaptureStatus.CAPTURED : CaptureStatus.CANCELED,
      status_reason: null,
    })) as unknown as CaptureDTO
  } catch (error) {
    logger.error(`Could not ${action} the payment of order group ${row.order_group_id}: ${reasonOf(error)}`)
    return (await connector.updateStripeCaptures({
      id: row.id,
      status: CaptureStatus.FAILED,
      status_reason: reasonOf(error),
    })) as unknown as CaptureDTO
  }
}

export const settleCapturesStepId = "settle-stripe-captures"

/** Acts on every capture the decision says is ready to capture or cancel. */
export const settleCapturesStep = createStep(
  settleCapturesStepId,
  async (input: { order_group_id?: string }, { container }) => {
    const connector = resolveConnector(container)
    const rows = (await connector.listStripeCaptures({
      status: [CaptureStatus.READY, CaptureStatus.CANCELABLE, CaptureStatus.FAILED],
      ...(input.order_group_id ? { order_group_id: input.order_group_id } : {}),
    })) as unknown as CaptureDTO[]

    const settled: CaptureDTO[] = []
    for (const row of rows) {
      const action = actionFor(row)
      if (action) {
        settled.push(await settleCapture(container, row, action))
      }
    }

    return new StepResponse(settled)
  }
)

export const settleCaptureStepId = "settle-stripe-capture"

/** An operator's capture or cancel of one order group, ahead of the decision. */
export const settleCaptureStep = createStep(
  settleCaptureStepId,
  async (input: { order_group_id: string; action: CaptureAction }, { container }) => {
    const connector = resolveConnector(container)
    const [row] = (await connector.listStripeCaptures({
      order_group_id: input.order_group_id,
    })) as unknown as CaptureDTO[]

    const open = [CaptureStatus.PENDING, CaptureStatus.READY, CaptureStatus.CANCELABLE, CaptureStatus.FAILED]
    if (!row || !open.includes(row.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order group ${input.order_group_id} has no payment waiting to be captured`
      )
    }

    if (input.action === "capture" && !MathBN.gt(row.capturable_amount, 0)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Nothing is left to capture")
    }

    const settled = await settleCapture(container, row, input.action)
    if (settled.status === CaptureStatus.FAILED) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, settled.status_reason ?? `${input.action} failed`)
    }

    return new StepResponse(settled)
  }
)
