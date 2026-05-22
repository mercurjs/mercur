import { useRegions } from "../../../../hooks/api/regions"
import { useCurrentSeller } from "../../../../hooks/api/sellers"
import { usePricePreferences } from "../../../../hooks/api/price-preferences"

export const usePriceListCurrencyData = () => {
  const {
    currency_code,
    isPending: isSellerPending,
    isError: isSellerError,
    error: sellerError,
  } = useCurrentSeller()

  const currencies = currency_code ? [currency_code] : undefined

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({
    fields: "id,name,currency_code",
    limit: 999,
  })

  const {
    price_preferences: pricePreferences,
    isPending: isPreferencesPending,
    isError: isPreferencesError,
    error: preferencesError,
  } = usePricePreferences({})

  const isReady =
    !!currencies &&
    !!regions &&
    !!pricePreferences &&
    !isSellerPending &&
    !isRegionsPending &&
    !isPreferencesPending

  if (isRegionsError) {
    throw regionsError
  }

  if (isSellerError) {
    throw sellerError
  }

  if (isPreferencesError) {
    throw preferencesError
  }

  if (!isReady) {
    return {
      regions: undefined,
      currencies: undefined,
      pricePreferences: undefined,
      isReady: false,
    }
  }

  return { regions, currencies, pricePreferences, isReady }
}
