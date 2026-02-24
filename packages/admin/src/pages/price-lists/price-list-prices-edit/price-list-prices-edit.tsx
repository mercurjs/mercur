import { useParams, useSearchParams } from "react-router-dom"
import { PriceListPricesEditForm } from "./components/price-list-prices-edit-form"
import { usePriceList, useProducts } from "@hooks/api"
import { RouteFocusModal } from "@components/modals"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"

export const PriceListPricesEdit = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get("ids[]")

  const { price_list, isLoading, isError, error } = usePriceList(id!)
  const productIds = ids?.split(",")

  const {
    products,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productError,
  } = useProducts({
    id: productIds,
    limit: productIds?.length || 9999, // Temporary until we support lazy loading in the DataGrid
    price_list_id: [id!],
    fields: "title,thumbnail,*variants",
  })

  const currencyData = usePriceListCurrencyData()

  const ready = currencyData.isReady &&
    !isLoading && !!price_list && !isProductsLoading && !!products

  if (isError) {
    throw error
  }

  if (isProductsError) {
    throw productError
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">Edit Prices for {price_list?.title}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        Update prices for products in the price list
      </RouteFocusModal.Description>
      {ready && (
        <PriceListPricesEditForm
          priceList={price_list}
          products={products}
          {...currencyData}
        />
      )}
    </RouteFocusModal>
  )
}
