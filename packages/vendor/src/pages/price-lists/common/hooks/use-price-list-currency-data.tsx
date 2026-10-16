import { isForbidden, usePermissions } from "@mercurjs/dashboard-shared"

import { useRegions } from "../../../../hooks/api/regions"
import { usePricePreferences } from "../../../../hooks/api/price-preferences"

export const usePriceListCurrencyData = () => {
  const { can } = usePermissions()
  const canViewRegions = can("regions")
  const canViewPreferences = can("price_preferences")

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions(
    {
      fields: "id,name,currency_code",
      limit: 999,
    },
    { enabled: canViewRegions }
  )

  const {
    price_preferences: pricePreferences,
    isPending: isPreferencesPending,
    isError: isPreferencesError,
    error: preferencesError,
  } = usePricePreferences({}, { enabled: canViewPreferences })

  const currencies = regions
    ? Array.from(new Set(regions.map((r) => r.currency_code)))
    : undefined

  const isReady =
    !!currencies &&
    !!regions &&
    !!pricePreferences &&
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
