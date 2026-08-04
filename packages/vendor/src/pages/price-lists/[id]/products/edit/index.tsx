import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { usePriceListEditGrid } from "../[variant_id]/edit/price-list-prices-edit-form/use-price-list-edit-grid"
import { PriceListPricesEditForm } from "../[variant_id]/edit/price-list-prices-edit-form"

export const Component = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get("ids[]")
  const productFilter = useMemo(
    () => (ids ? ids.split(",") : undefined),
    [ids]
  )

  const {
    price_list,
    gridData,
    variantIdByOffer,
    currencyData,
    ready,
    isError,
    error,
    isProductsError,
    productError,
  } = usePriceListEditGrid(id!, productFilter)

  if (isError) {
    throw error
  }

  if (isProductsError) {
    throw productError
  }

  return (
    <RouteFocusModal prev={`/price-lists/${id}`}>
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
          gridData={gridData}
          variantIdByOffer={variantIdByOffer}
          regions={currencyData.regions}
          currencies={currencyData.currencies}
          pricePreferences={currencyData.pricePreferences}
        />
      )}
    </RouteFocusModal>
  )
}
