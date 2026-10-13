import type { AdminReturnRequest } from "../../../hooks/api/return-requests"

type StatusColor = "green" | "red" | "orange" | "blue" | "grey" | "purple"

export const RETURN_REQUEST_STATUSES = [
  "pending",
  "accepted",
  "awaiting_return",
  "returned",
  "refunded",
  "declined",
  "withdrawn",
] as const

export const getReturnRequestStatusColor = (
  status: AdminReturnRequest["status"]
): StatusColor => {
  switch (status) {
    case "refunded":
      return "green"
    case "declined":
      return "red"
    case "withdrawn":
      return "grey"
    case "accepted":
    case "awaiting_return":
      return "blue"
    case "returned":
      return "purple"
    case "pending":
    default:
      return "orange"
  }
}

export const customerName = (
  customer?: AdminReturnRequest["customer"] | null
) => {
  if (!customer) {
    return "-"
  }
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
  return name || customer.email || "-"
}

export const isApprovable = (status: AdminReturnRequest["status"]) =>
  status === "accepted" || status === "returned"

export const isDeclinable = (status: AdminReturnRequest["status"]) =>
  status === "pending" ||
  status === "accepted" ||
  status === "awaiting_return" ||
  status === "returned"
