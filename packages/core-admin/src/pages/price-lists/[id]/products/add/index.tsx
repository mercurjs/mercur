import { RouteFocusModal } from "@components/modals"
import { useParams } from "react-router-dom"
import { usePriceList } from "@hooks/api"

import { usePriceListCurrencyData } from "@pages/price-lists/common/hooks/use-price-list-currency-data"
import { PriceListPricesAddForm } from "@pages/price-lists/price-list-prices-add/components/price-list-prices-add-form"

const PriceListProductsAdd = () => {
  const { id } = useParams<{ id: string }>()

  const { price_list, isPending, isError, error } = usePriceList(id!)
  const currencyData = usePriceListCurrencyData()

  const ready = currencyData.isReady && !isPending && !!price_list

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      {ready && (
        <PriceListPricesAddForm
          priceList={price_list}
          {...currencyData}
        />
      )}
    </RouteFocusModal>
  )
}

export const Component = PriceListProductsAdd
