import { HttpTypes } from "@medusajs/types"
import { useRegions } from "@hooks/api/regions"
import { useStoreCurrencies } from "@hooks/api/use-store-currencies"

type UsePriceListCurrencyDataReturn =
  | {
      isReady: false
      currencies: undefined
      regions: undefined
      pricePreferences: undefined
    }
  | {
      isReady: true
      currencies: HttpTypes.AdminStoreCurrency[]
      regions: HttpTypes.AdminRegion[]
      pricePreferences: HttpTypes.AdminPricePreference[]
    }

export const usePriceListCurrencyData = (): UsePriceListCurrencyDataReturn => {
  const { currencies, isPending: isCurrenciesPending } = useStoreCurrencies()

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({
    fields: "id,name,currency_code",
    limit: 999,
  })

  const isReady = !!currencies && !!regions && !isCurrenciesPending && !isRegionsPending

  if (isRegionsError) {
    throw regionsError
  }

  if (!isReady) {
    return {
      regions: undefined,
      currencies: undefined,
      pricePreferences: undefined,
      isReady: false,
    }
  }

  return {
    regions,
    currencies,
    pricePreferences: [],
    isReady,
  }
}
