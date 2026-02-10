// Route: /price-lists/create
import { RouteFocusModal } from "@components/modals"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"
import { PriceListCreateForm } from "./price-list-create-form"

export const Component = () => {
  const { isReady, regions, currencies, pricePreferences } =
    usePriceListCurrencyData()

  return (
    <RouteFocusModal>
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
