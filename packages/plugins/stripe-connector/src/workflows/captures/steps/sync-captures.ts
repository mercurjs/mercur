import { BigNumberInput } from "@medusajs/framework/types"
import { MathBN } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CaptureDTO, CaptureStatus, OPEN_CAPTURE_STATUSES } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { loadCaptureRows } from "../utils/capture-rows"

export type SyncCapturesStepInput = {
  order_group_ids?: string[]
}

type Compensation = {
  created: string[]
  previous: CaptureDTO[]
}

// A failed attempt stays visible until the payment is captured or canceled,
// even while the decision still says capture or cancel.
const keepFailed = (existing: CaptureDTO | undefined, next: CaptureStatus) =>
  existing?.status === CaptureStatus.FAILED &&
  (next === CaptureStatus.READY || next === CaptureStatus.CANCELABLE)

const toNumber = (value: BigNumberInput) => MathBN.convert(value).toNumber()

export const syncCapturesStepId = "sync-stripe-captures"

/**
 * Writes the capture state of each order group's cart payment: one
 * `stripe_capture` row per order group, created on first sight.
 */
export const syncCapturesStep = createStep(
  syncCapturesStepId,
  async (input: SyncCapturesStepInput, { container }) => {
    const connector = resolveConnector(container)

    const open = input.order_group_ids
      ? []
      : await connector.listStripeCaptures({ status: OPEN_CAPTURE_STATUSES }, { select: ["payment_collection_id"] })

    const rows = await loadCaptureRows(container, connector.getOptions(), {
      order_group_ids: input.order_group_ids,
      payment_collection_ids: open.map((row) => row.payment_collection_id),
    })
    if (!rows.length) {
      return new StepResponse<CaptureDTO[], Compensation>([], { created: [], previous: [] })
    }

    const existing = (await connector.listStripeCaptures({
      order_group_id: rows.map((row) => row.order_group_id),
    })) as unknown as CaptureDTO[]
    const byGroup = new Map(existing.map((row) => [row.order_group_id, row]))

    const toCreate = rows.filter((row) => !byGroup.has(row.order_group_id))
    const toUpdate = rows
      .filter((row) => byGroup.has(row.order_group_id))
      .map((row) => {
        const current = byGroup.get(row.order_group_id) as CaptureDTO
        const status = keepFailed(current, row.status) ? CaptureStatus.FAILED : row.status
        return {
          ...row,
          id: current.id,
          status,
          status_reason: status === CaptureStatus.FAILED ? current.status_reason : null,
        }
      })

    const created = toCreate.length
      ? await connector.createStripeCaptures(
          toCreate.map((row) => ({
            ...row,
            authorized_amount: toNumber(row.authorized_amount),
            capturable_amount: toNumber(row.capturable_amount),
          }))
        )
      : []
    const updated = toUpdate.length
      ? await connector.updateStripeCaptures(
          toUpdate.map((row) => ({
            ...row,
            authorized_amount: toNumber(row.authorized_amount),
            capturable_amount: toNumber(row.capturable_amount),
          }))
        )
      : []

    return new StepResponse([...created, ...updated] as unknown as CaptureDTO[], {
      created: created.map((row) => row.id),
      previous: existing.filter((row) => toUpdate.some((next) => next.id === row.id)),
    })
  },
  async (compensation, { container }) => {
    if (!compensation) return
    const connector = resolveConnector(container)
    if (compensation.created.length) {
      await connector.deleteStripeCaptures(compensation.created)
    }
    if (compensation.previous.length) {
      await connector.updateStripeCaptures(
        compensation.previous.map((row) => ({
          id: row.id,
          status: row.status,
          status_reason: row.status_reason,
          capturable_amount: toNumber(row.capturable_amount),
          orders_total: row.orders_total,
          orders_decided: row.orders_decided,
          expires_at: row.expires_at,
        }))
      )
    }
  }
)
