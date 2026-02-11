// Route: /price-lists/create
import { RouteFocusModal } from "@components/modals"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"
import { PriceListCreateForm } from "./price-list-create-form"

export const Component = () => {
  const { isReady, regions, currencies, pricePreferences } =
    usePriceListCurrencyData()

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">Create Price List</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        Create a new price list with custom pricing
      </RouteFocusModal.Description>
      {isReady && (
        <PriceListCreateForm
          regions={regions}
          currencies={currencies}
          pricePreferences={pricePreferences}
        />
      )}
    </RouteFocusModal>
  )
}
