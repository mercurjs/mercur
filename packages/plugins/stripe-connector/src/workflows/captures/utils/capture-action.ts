import { MathBN } from "@medusajs/framework/utils"

import { CaptureDTO, CaptureStatus } from "../../../types/common"

export type CaptureAction = "capture" | "cancel"

// A failed row has lost its decision; what is left to capture tells which way it went.
export const actionFor = (row: CaptureDTO): CaptureAction | null => {
  switch (row.status) {
    case CaptureStatus.READY:
      return "capture"
    case CaptureStatus.CANCELABLE:
      return "cancel"
    case CaptureStatus.FAILED:
      return MathBN.gt(row.capturable_amount, 0) ? "capture" : "cancel"
    default:
      return null
  }
}
