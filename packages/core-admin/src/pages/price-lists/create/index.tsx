import { RouteFocusModal } from "@components/modals"

import { usePriceListCurrencyData } from "@pages/price-lists/common/hooks/use-price-list-currency-data"
import { PriceListCreateForm } from "@pages/price-lists/price-list-create/components/price-list-create-form"

const PriceListCreate = () => {
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

export const Component = PriceListCreate
