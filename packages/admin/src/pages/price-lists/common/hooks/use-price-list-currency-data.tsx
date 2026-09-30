import { HttpTypes } from "@medusajs/types"
import { isForbidden, usePermissions } from "@mercurjs/dashboard-shared"
import { useRegions } from "../../../../hooks/api/regions"
import { useStore } from "../../../../hooks/api/store"
import { usePricePreferences } from "../../../../hooks/api/price-preferences"

type UsePriceListCurrencyDataReturn =
  | {
      isReady: false
      isForbidden: boolean
      currencies: undefined
      regions: undefined
      pricePreferences: undefined
    }
  | {
      isReady: true
      isForbidden: false
      currencies: HttpTypes.AdminStoreCurrency[]
      regions: HttpTypes.AdminRegion[]
      pricePreferences: HttpTypes.AdminPricePreference[]
    }

export const usePriceListCurrencyData = (): UsePriceListCurrencyDataReturn => {
  const { can } = usePermissions()
  const canViewRegions = can("regions")
  const canViewPreferences = can("price_preferences")

  const {
    store,
    isPending: isStorePending,
    isError: isStoreError,
    error: storeError,
  } = useStore({
    fields: "+supported_currencies",
  })

  const currencies = store?.supported_currencies

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

  const forbidden =
    !canViewRegions ||
    !canViewPreferences ||
    isForbidden(regionsError) ||
    isForbidden(preferencesError)

  const isReady =
    !!currencies &&
    !!regions &&
    !!pricePreferences &&
    !isStorePending &&
    !isRegionsPending &&
    !isPreferencesPending

  if (isRegionsError && !forbidden) {
    throw regionsError
  }

  if (isStoreError) {
    throw storeError
  }

  if (isPreferencesError && !forbidden) {
    throw preferencesError
  }

  if (forbidden || !isReady) {
    return {
      isForbidden: forbidden,
      regions: undefined,
      currencies: undefined,
      pricePreferences: undefined,
      isReady: false as const,
    }
  }

  return { regions, currencies, pricePreferences, isReady, isForbidden: false }
}
