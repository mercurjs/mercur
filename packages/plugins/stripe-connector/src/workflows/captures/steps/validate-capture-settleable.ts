import { MathBN, MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CaptureStatus, OPEN_CAPTURE_STATUSES } from "../../../types/common"
import { CaptureAction } from "../utils/capture-action"

export type ValidateCaptureSettleableStepInput = {
  order_group_id: string
  action: CaptureAction
  capture: { status: CaptureStatus; capturable_amount: number | string } | null | undefined
}

export const validateCaptureSettleableStepId = "validate-stripe-capture-settleable"

export const validateCaptureSettleableStep = createStep(
  validateCaptureSettleableStepId,
  async (input: ValidateCaptureSettleableStepInput) => {
    if (!input.capture || !OPEN_CAPTURE_STATUSES.includes(input.capture.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order group ${input.order_group_id} has no payment waiting to be captured`
      )
    }
    if (input.action === "capture" && !MathBN.gt(input.capture.capturable_amount, 0)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Nothing is left to capture")
    }
    return new StepResponse(void 0)
  }
)
