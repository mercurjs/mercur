import { CaptureDTO, CaptureStatus } from "../../../../types/common"
import { actionFor } from "../capture-action"

const row = (status: CaptureStatus, capturable_amount = 100): CaptureDTO => ({
  id: "scap_1",
  order_group_id: "ogrp_1",
  payment_collection_id: "pay_col_1",
  payment_id: "pay_1",
  currency_code: "eur",
  authorized_amount: 100,
  capturable_amount,
  orders_total: 1,
  orders_decided: 1,
  status,
  status_reason: null,
  authorized_at: null,
  expires_at: null,
  created_at: new Date(),
  updated_at: new Date(),
})

describe("actionFor", () => {
  it("captures ready rows and releases cancelable ones", () => {
    expect(actionFor(row(CaptureStatus.READY))).toBe("capture")
    expect(actionFor(row(CaptureStatus.CANCELABLE))).toBe("cancel")
  })

  it("retries a failed row the way its capturable amount points", () => {
    expect(actionFor(row(CaptureStatus.FAILED, 40))).toBe("capture")
    expect(actionFor(row(CaptureStatus.FAILED, 0))).toBe("cancel")
  })

  it("leaves pending, expired and settled rows alone", () => {
    for (const status of [CaptureStatus.PENDING, CaptureStatus.EXPIRED, CaptureStatus.CAPTURED, CaptureStatus.CANCELED]) {
      expect(actionFor(row(status))).toBeNull()
    }
  })
})
