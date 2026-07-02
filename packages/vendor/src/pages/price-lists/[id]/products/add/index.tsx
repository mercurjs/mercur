// Route: /price-lists/:id/products/add
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteFocusModal } from "@components/modals"
import { usePriceList } from "@hooks/api/price-lists"
import { usePriceListCurrencyData } from "../../../common/hooks/use-price-list-currency-data"
import { PriceListPricesAddForm } from "./price-list-prices-add-form"

export const Component = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()

  const { price_list, isPending, isError, error } = usePriceList(id!)
  const currencyData = usePriceListCurrencyData()

  const ready = currencyData.isReady && !isPending && !!price_list

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("priceLists.products.add.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("priceLists.products.add.description")}
      </RouteFocusModal.Description>
      {ready && (
        <PriceListPricesAddForm priceList={price_list} {...currencyData} />
      )}
    </RouteFocusModal>
  )
}
