import { MathBN } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CaptureDTO } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"

export type UpdateStripeCapturesStepInput = (Partial<Omit<CaptureDTO, "id">> & { id: string })[]

const UPDATABLE = [
  "status",
  "status_reason",
  "capturable_amount",
  "authorized_amount",
  "orders_total",
  "orders_decided",
  "authorized_at",
  "expires_at",
] as const

const toWrite = (row: UpdateStripeCapturesStepInput[number]) => ({
  ...row,
  ...(row.capturable_amount !== undefined
    ? { capturable_amount: MathBN.convert(row.capturable_amount).toNumber() }
    : {}),
  ...(row.authorized_amount !== undefined
    ? { authorized_amount: MathBN.convert(row.authorized_amount).toNumber() }
    : {}),
})

export const updateStripeCapturesStepId = "update-stripe-captures"

export const updateStripeCapturesStep = createStep(
  updateStripeCapturesStepId,
  async (input: UpdateStripeCapturesStepInput, { container }) => {
    if (!input.length) {
      return new StepResponse<CaptureDTO[], UpdateStripeCapturesStepInput>([], [])
    }
    const connector = resolveConnector(container)
    const previous = await connector.listStripeCaptures({ id: input.map((row) => row.id) }, { take: null })
    const updated = await connector.updateStripeCaptures(input.map(toWrite))

    return new StepResponse(
      updated,
      previous.map((row) => ({
        id: row.id,
        ...Object.fromEntries(UPDATABLE.map((field) => [field, row[field]])),
      }))
    )
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }
    await resolveConnector(container).updateStripeCaptures(previous.map(toWrite))
  }
)
