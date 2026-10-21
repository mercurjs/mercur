const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
]

export const nextWebhookAttemptAt = (
  attempts: number,
  now = new Date()
): Date | null => {
  const delay = RETRY_DELAYS_MS[attempts - 1]

  return delay === undefined ? null : new Date(now.getTime() + delay)
}
