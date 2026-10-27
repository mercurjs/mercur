import { HttpTypes } from "@medusajs/types"

export type ExpectedDelivery = {
  shipping_deadline: string
  earliest: string | null
  latest: string | null
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const SHIPPED_STATUSES = ["fulfilled", "shipped", "delivered"]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asDateString = (value: unknown) =>
  typeof value === "string" && DATE_ONLY.test(value) ? value : null

export const getExpectedDelivery = (
  order: object | null | undefined
): ExpectedDelivery | null => {
  const raw = order && "expected_delivery" in order ? order.expected_delivery : undefined

  if (!isRecord(raw)) {
    return null
  }

  const shippingDeadline = asDateString(raw.shipping_deadline)

  if (!shippingDeadline) {
    return null
  }

  return {
    shipping_deadline: shippingDeadline,
    earliest: asDateString(raw.earliest),
    latest: asDateString(raw.latest),
  }
}

// `new Date("YYYY-MM-DD")` is UTC midnight and renders as the previous day
// west of Greenwich, so calendar dates are built in local time.
export const parseCalendarDate = (value: string) => {
  const match = DATE_ONLY.exec(value)

  if (!match) {
    return null
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export type ShipByState = "overdue" | "due_today" | null

export const getShipByState = (
  order: Pick<HttpTypes.AdminOrder, "status" | "fulfillment_status">,
  shippingDeadline: string
): ShipByState => {
  if (
    order.status === "canceled" ||
    SHIPPED_STATUSES.includes(order.fulfillment_status)
  ) {
    return null
  }

  const deadline = parseCalendarDate(shippingDeadline)

  if (!deadline) {
    return null
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (deadline.getTime() < today.getTime()) {
    return "overdue"
  }

  if (deadline.getTime() === today.getTime()) {
    return "due_today"
  }

  return null
}
