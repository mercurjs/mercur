import { MathBN } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CaptureDTO } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { CaptureRowInput } from "../utils/capture-rows"

export const createStripeCapturesStepId = "create-stripe-captures"

export const createStripeCapturesStep = createStep(
  createStripeCapturesStepId,
  async (input: CaptureRowInput[], { container }) => {
    if (!input.length) {
      return new StepResponse<CaptureDTO[], string[]>([], [])
    }
    const created = await resolveConnector(container).createStripeCaptures(
      input.map((row) => ({
        ...row,
        authorized_amount: MathBN.convert(row.authorized_amount).toNumber(),
        capturable_amount: MathBN.convert(row.capturable_amount).toNumber(),
      }))
    )
    return new StepResponse(
      created,
      created.map((row) => row.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    await resolveConnector(container).deleteStripeCaptures(ids)
  }
)
