// Route: /price-lists/:id/products/:variant_id/edit
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { usePriceList, usePriceListProducts } from "@hooks/api/price-lists"
import { usePriceListCurrencyData } from "../../../../common/hooks/use-price-list-currency-data"
import { PriceListPricesEditForm } from "./price-list-prices-edit-form"

export const Component = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { price_list, isLoading, isError, error } = usePriceList(id!)

  const {
    products,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productError,
  } = usePriceListProducts(id!)

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
        <span className="sr-only">
          {t("priceLists.products.edit.title", { title: price_list?.title })}
        </span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("priceLists.products.edit.description")}
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
