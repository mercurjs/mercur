import { isForbidden, usePermissions } from "@mercurjs/dashboard-shared"

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
  const { can } = usePermissions()
  const canViewRegions = can("regions")
  const canViewPreferences = can("price_preferences")

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

  const isNoAccess =
    !canViewRegions ||
    !canViewPreferences ||
    isForbidden(regionsError) ||
    isForbidden(preferencesError)

  if (isRegionsError && !isForbidden(regionsError)) {
    throw regionsError
  }

  if (isSellerError) {
    throw sellerError
  }

  if (isPreferencesError && !isForbidden(preferencesError)) {
    throw preferencesError
  }

  if (!isReady || isNoAccess) {
    return {
      regions: undefined,
      currencies: undefined,
      pricePreferences: undefined,
      isReady: false,
      isNoAccess,
    }
  }

  return { regions, currencies, pricePreferences, isReady, isNoAccess }
}
