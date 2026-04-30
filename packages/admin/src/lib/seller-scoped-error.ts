import type { TFunction } from "i18next"

import { ClientError } from "@mercurjs/client"

const CODE_TO_KEY: Record<string, string> = {
  LOCATION_NOT_SELLER_VALID: "orders.errors.locationNotSellerValid",
  SHIPPING_OPTION_NOT_SELLER_VALID:
    "orders.errors.shippingOptionNotSellerValid",
  VARIANT_NOT_SELLER_VALID: "orders.errors.variantNotSellerValid",
}

/**
 * Maps spec 006 backend error codes (LOCATION_NOT_SELLER_VALID,
 * SHIPPING_OPTION_NOT_SELLER_VALID, VARIANT_NOT_SELLER_VALID) to
 * translated copy. Returns null when the error is not one of these,
 * so callers can fall back to the raw `error.message`.
 */
export const getSellerScopedErrorMessage = (
  error: unknown,
  t: TFunction
): string | null => {
  if (!(error instanceof ClientError)) return null
  if (!error.code) return null
  const key = CODE_TO_KEY[error.code]
  return key ? t(key) : null
}

/**
 * Convenience wrapper for `toast.error(...)` callers: returns the
 * translated copy if the error is one of the scoped codes, otherwise
 * the raw `error.message`. Falls back to a generic translated copy if
 * the error has no message so the return type is always `string`.
 */
export const resolveErrorToastMessage = (
  error: unknown,
  t: TFunction
): string => {
  const scoped = getSellerScopedErrorMessage(error, t)
  if (scoped) return scoped
  if (error instanceof Error && error.message) return error.message
  return t("general.error")
}
