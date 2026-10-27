type BadgeColor = "green" | "red" | "blue" | "orange" | "grey"

export const PAYOUT_STATUSES = [
  "pending",
  "on_hold",
  "processing",
  "paid",
  "failed",
  "aborted",
] as const

const STATUS_COLORS: Record<string, BadgeColor> = {
  pending: "grey",
  on_hold: "orange",
  processing: "blue",
  paid: "green",
  failed: "red",
  aborted: "red",
}

export const payoutStatusColor = (status: string): BadgeColor =>
  STATUS_COLORS[status] ?? "grey"
