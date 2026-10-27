export type DeliveryClosure = {
  closed_from?: Date | string | null
  closed_to?: Date | string | null
}

export type ExpectedDelivery = {
  shipping_deadline: string
  earliest: string | null
  latest: string | null
}

export type ComputeExpectedDeliveryInput = {
  start: Date | string
  leadtimeDays: number | null
  transitMinDays: number | null
  transitMaxDays: number | null
  closure?: DeliveryClosure | null
}

type TransitValue = number | string | null | undefined

const DAY_MS = 24 * 60 * 60 * 1000

const toUtcDay = (value: Date | string): Date => {
  const date = new Date(value)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

const isWeekend = (day: Date) => day.getUTCDay() === 0 || day.getUTCDay() === 6

const toDays = (value: TransitValue): number | null => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  const days = Number(value)
  return Number.isInteger(days) && days >= 0 ? days : null
}

/**
 * Moves to the first open day on or after `from`, then forward `days` more
 * open days.
 */
const addOpenDays = (
  from: Date,
  days: number,
  isClosed: (day: Date) => boolean
): Date => {
  let day = from
  while (isClosed(day)) {
    day = new Date(day.getTime() + DAY_MS)
  }
  for (let i = 0; i < days; i++) {
    day = new Date(day.getTime() + DAY_MS)
    while (isClosed(day)) {
      day = new Date(day.getTime() + DAY_MS)
    }
  }
  return day
}

const formatDay = (day: Date) => day.toISOString().slice(0, 10)

/**
 * Lead time counts business days (Monday to Friday) the seller is open; the
 * transit time counts business days only. Dates are calendar days in UTC.
 */
export const computeExpectedDelivery = ({
  start,
  leadtimeDays,
  transitMinDays,
  transitMaxDays,
  closure,
}: ComputeExpectedDeliveryInput): ExpectedDelivery => {
  const closedFrom = closure?.closed_from ? toUtcDay(closure.closed_from) : null
  const closedTo = closure?.closed_to ? toUtcDay(closure.closed_to) : null

  const isSellerClosed = (day: Date) =>
    isWeekend(day) ||
    (!!closedFrom &&
      day.getTime() >= closedFrom.getTime() &&
      (!closedTo || day.getTime() <= closedTo.getTime()))

  const deadline = addOpenDays(
    toUtcDay(start),
    leadtimeDays ?? 0,
    isSellerClosed
  )

  return {
    shipping_deadline: formatDay(deadline),
    earliest:
      transitMinDays === null
        ? null
        : formatDay(addOpenDays(deadline, transitMinDays, isWeekend)),
    latest:
      transitMaxDays === null
        ? null
        : formatDay(addOpenDays(deadline, transitMaxDays, isWeekend)),
  }
}

/**
 * A seller's transit override on the shipping option wins over the
 * marketplace rule's default.
 */
export const resolveTransitDays = (
  optionMetadata: Record<string, unknown> | null | undefined,
  rule:
    | {
        transit_min_days?: TransitValue
        transit_max_days?: TransitValue
      }
    | null
    | undefined
): { min: number | null; max: number | null } => ({
  min:
    toDays(optionMetadata?.transit_min_days as TransitValue) ??
    toDays(rule?.transit_min_days),
  max:
    toDays(optionMetadata?.transit_max_days as TransitValue) ??
    toDays(rule?.transit_max_days),
})
