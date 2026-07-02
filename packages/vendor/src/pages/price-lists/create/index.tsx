// Route: /price-lists/create
import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "@components/modals"
import { usePriceListCurrencyData } from "../common/hooks/use-price-list-currency-data"
import { PriceListCreateForm } from "./price-list-create-form"

export const Component = () => {
  const { t } = useTranslation()
  const { isReady, regions, currencies, pricePreferences } =
    usePriceListCurrencyData()

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("priceLists.create.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("priceLists.create.subheader")}
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
