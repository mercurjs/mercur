// Route: /price-lists/:id/products/edit
import { useParams, useSearchParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { usePriceList, useProducts } from "@hooks/api"
import { usePriceListCurrencyData } from "../../../common/hooks/use-price-list-currency-data"
import { PriceListPricesEditForm } from "../[variant_id]/edit/price-list-prices-edit-form"

export const Component = () => {
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
    limit: productIds?.length || 9999,
    price_list_id: [id!],
    fields: "title,thumbnail,*variants",
  })

  const priceListCurrencyData = usePriceListCurrencyData()

  const ready =
    !isLoading &&
    !!price_list &&
    !isProductsLoading &&
    !!products &&
    priceListCurrencyData.isReady

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
          {...priceListCurrencyData}
        />
      )}
    </RouteFocusModal>
  )
}
