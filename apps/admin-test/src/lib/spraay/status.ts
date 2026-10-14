import type { TFunction } from "i18next"

import type { SpraayBatch } from "./api"

export const SPRAAY_BATCH_STATUSES = [
  "assembling",
  "awaiting_signature",
  "broadcasting",
  "confirming",
  "settled",
  "failed",
  "expired",
  "canceled",
] as const

export type SpraayBatchStatus = (typeof SPRAAY_BATCH_STATUSES)[number]

type StatusColor = "green" | "red" | "blue" | "orange" | "grey" | "purple"

const STATUS_COLORS: Record<SpraayBatchStatus, StatusColor> = {
  assembling: "grey",
  awaiting_signature: "orange",
  broadcasting: "blue",
  confirming: "blue",
  settled: "green",
  failed: "red",
  expired: "grey",
  canceled: "grey",
}

export const getBatchStatusProps = (status: string, t: TFunction) => {
  const known = (SPRAAY_BATCH_STATUSES as readonly string[]).includes(status)
  return {
    color: known ? STATUS_COLORS[status as SpraayBatchStatus] : ("grey" as const),
    label: known ? t(`spraay.status.${status}`) : status,
  }
}

export const isCancelable = (batch: Pick<SpraayBatch, "status">) =>
  batch.status === "assembling" || batch.status === "awaiting_signature"

/**
 * True when the batch is closed but still holds its payouts because a transaction at
 * its pinned nonce could execute. Mirrors the reconciler's release rules.
 */
export const isHoldingPayouts = (batch: SpraayBatch) =>
  ["failed", "expired", "canceled"].includes(batch.status) &&
  batch.unsigned_tx_nonce !== null &&
  !batch.block_number &&
  batch.items.some((item) => !item.released_at)
