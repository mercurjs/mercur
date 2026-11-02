import { PayoutProviderError, PayoutProviderErrorCode } from "@mercurjs/types"

const DEFINITIVE_TYPES = ["StripeInvalidRequestError", "StripeCardError"]

type StripeErrorShape = {
  type?: unknown
  code?: unknown
  statusCode?: unknown
}

/**
 * Whether Stripe refused the request for good. Anything else (connection
 * errors, 5xx, rate limits, idempotency conflicts) may still have gone
 * through, so it is retried with the same idempotency key.
 */
export const isDefinitiveStripeRefusal = (error: unknown): boolean => {
  if (error instanceof PayoutProviderError) {
    return error.code !== PayoutProviderErrorCode.UNKNOWN
  }
  if (!error || typeof error !== "object") {
    return false
  }
  const { type, statusCode } = error as StripeErrorShape
  if (statusCode === 409 || statusCode === 429) {
    return false
  }
  if (typeof type === "string" && DEFINITIVE_TYPES.includes(type)) {
    return true
  }
  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 500
}

export class StripePayoutProviderError extends PayoutProviderError {
  readonly type: string | null
  readonly stripeCode: string | null
  readonly statusCode: number | null

  constructor(error: unknown) {
    super(error instanceof Error ? error.message : String(error), {
      code: isDefinitiveStripeRefusal(error) ? PayoutProviderErrorCode.REFUSED : PayoutProviderErrorCode.UNKNOWN,
    })
    const shape = (error && typeof error === "object" ? error : {}) as StripeErrorShape
    this.name = "StripePayoutProviderError"
    this.type = typeof shape.type === "string" ? shape.type : null
    this.stripeCode = typeof shape.code === "string" ? shape.code : null
    this.statusCode = typeof shape.statusCode === "number" ? shape.statusCode : null
  }
}

export const toPayoutProviderError = (error: unknown): PayoutProviderError =>
  error instanceof PayoutProviderError ? error : new StripePayoutProviderError(error)
