import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { normalizeLocale } from "@medusajs/framework/utils"

const LOCALE_HEADER = "x-medusa-locale"
const LOCALE_COOKIE = "lng"

const parseAcceptLanguage = (value?: string): string | undefined => {
  if (!value) {
    return undefined
  }

  const [first] = value.split(",")
  const tag = first?.split(";")[0]?.trim()

  return tag || undefined
}

/**
 * Resolves the locale for a vendor request and exposes it on `req.locale` so
 * routes can forward it to `query.graph` and unlock the Translation Module.
 *
 * The framework only registers its locale middleware for the `/store`
 * namespace, so vendor routes have to resolve it themselves.
 *
 * Resolution order:
 * 1. `?locale=` query parameter
 * 2. `x-medusa-locale` header
 * 3. `lng` cookie (set by the vendor panel language switcher)
 * 4. `Accept-Language` header
 */
export const applyVendorLocale = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const queryLocale =
    typeof req.query.locale === "string" ? req.query.locale : undefined
  if (queryLocale) {
    delete req.query.locale
  }

  const resolved =
    queryLocale ||
    req.get(LOCALE_HEADER) ||
    req.cookies?.[LOCALE_COOKIE] ||
    parseAcceptLanguage(req.get("accept-language"))

  if (resolved) {
    req.locale = normalizeLocale(resolved)
  }

  return next()
}
