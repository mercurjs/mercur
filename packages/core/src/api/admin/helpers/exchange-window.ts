/**
 * Mercur exchange window — fixed at 30 days for all stores per
 * designer Note K (`04-figma-ui-gaps/create-exchange.md` G-CE-14).
 *
 * Single source of truth for both the backend invariant
 * (`requireExchangeWindowOpen` middleware) and the admin UI gate
 * (Summary `…` menu disable + tooltip). Per-store policy is
 * deliberately out of scope for this batch.
 */
export const EXCHANGE_WINDOW_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Returns true when the order is still within the configured exchange
 * window. The window opens at `order.created_at` and closes
 * `EXCHANGE_WINDOW_DAYS` later. Pass `now` to override the wall clock
 * in tests.
 */
export const isWithinExchangeWindow = (
  orderCreatedAt: Date | string,
  now: number = Date.now()
): boolean => {
  const created = new Date(orderCreatedAt).getTime()
  const ageDays = (now - created) / MS_PER_DAY
  return ageDays <= EXCHANGE_WINDOW_DAYS
}
