import { HttpTypes } from "@medusajs/types"
import { useCurrencies } from "./currencies"
import { useStore } from "./store"

/**
 * Returns store's supported currencies with a fallback to all available currencies.
 * The vendor /sellers/me endpoint may not return supported_currencies,
 * so we fall back to the /vendor/currencies endpoint.
 */
export const useStoreCurrencies = () => {
  const { store, isPending: isStorePending } = useStore()
  const storeCurrencies = store?.supported_currencies

  const { currencies: allCurrencies, isPending: isCurrenciesPending } =
    useCurrencies({ limit: 999 }, { enabled: !storeCurrencies && !isStorePending })

  const currencies: HttpTypes.AdminStoreCurrency[] | undefined =
    storeCurrencies ??
    (allCurrencies?.map((c) => ({
      currency_code: c.code,
      is_default: false,
      currency: c,
    })) as HttpTypes.AdminStoreCurrency[] | undefined)

  const isPending = isStorePending || (!storeCurrencies && isCurrenciesPending)

  return { currencies, isPending }
}
