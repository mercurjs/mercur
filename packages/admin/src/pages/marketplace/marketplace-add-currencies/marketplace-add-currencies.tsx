import {
  SectionNoAccess,
  isForbidden,
  usePermissions,
} from "@mercurjs/dashboard-shared"
import { RouteFocusModal } from "../../../components/modals"
import { usePricePreferences } from "../../../hooks/api/price-preferences"
import { useStore } from "../../../hooks/api/store"
import { AddCurrenciesForm } from "./components/add-currencies-form/add-currencies-form"

export const MarketplaceAddCurrencies = () => {
  const { can } = usePermissions()
  const canViewCurrencies = can("regions")
  const canViewPreferences = can("price_preferences")

  const { store, isPending, isError, error } = useStore()

  const {
    price_preferences: pricePreferences,
    isPending: isPricePreferencesPending,
    isError: isPricePreferencesError,
    error: pricePreferencesError,
  } = usePricePreferences(
    {
      attribute: "currency_code",
      value: store?.supported_currencies?.map((c) => c.currency_code),
    },
    {
      enabled: !!store && canViewPreferences,
    }
  )

  const forbidden =
    !canViewCurrencies ||
    !canViewPreferences ||
    isForbidden(pricePreferencesError)

  const ready =
    !forbidden &&
    !!store && !isPending && !!pricePreferences && !isPricePreferencesPending

  if (isError) {
    throw error
  }

  if (isPricePreferencesError && !forbidden) {
    throw pricePreferencesError
  }

  return (
    <RouteFocusModal>
      {forbidden && (
        <>
          <RouteFocusModal.Header />
          <RouteFocusModal.Body>
            <SectionNoAccess />
          </RouteFocusModal.Body>
        </>
      )}
      {ready && (
        <AddCurrenciesForm store={store} pricePreferences={pricePreferences} />
      )}
    </RouteFocusModal>
  )
}
