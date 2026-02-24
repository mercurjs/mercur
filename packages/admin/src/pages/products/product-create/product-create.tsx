import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "../../../components/modals"
import { useRegions } from "../../../hooks/api"
import { usePricePreferences } from "../../../hooks/api/price-preferences"
import { useSalesChannel } from "../../../hooks/api/sales-channels"
import { useStore } from "../../../hooks/api/store"
import { ProductCreateForm } from "./components/product-create-form/product-create-form"

export const ProductCreate = () => {
  const { t } = useTranslation()

  const {
    store,
    isPending: isStorePending,
    isError: isStoreError,
    error: storeError,
  } = useStore({
    fields: "+default_sales_channel",
  })

  const {
    sales_channel,
    isPending: isSalesChannelPending,
    isError: isSalesChannelError,
    error: salesChannelError,
  } = useSalesChannel(store?.default_sales_channel_id!, {
    enabled: !!store?.default_sales_channel_id,
  })

  const {
    regions,
    isPending: isRegionsPending,
    isError: isRegionsError,
    error: regionsError,
  } = useRegions({ limit: 9999 })

  const {
    price_preferences,
    isPending: isPricePreferencesPending,
    isError: isPricePreferencesError,
    error: pricePreferencesError,
  } = usePricePreferences({
    limit: 9999,
  })

  const ready =
    !!store &&
    !isStorePending &&
    !!regions &&
    !isRegionsPending &&
    !!sales_channel &&
    !isSalesChannelPending &&
    !!price_preferences &&
    !isPricePreferencesPending

  if (isStoreError) {
    throw storeError
  }

  if (isRegionsError) {
    throw regionsError
  }

  if (isSalesChannelError) {
    throw salesChannelError
  }

  if (isPricePreferencesError) {
    throw pricePreferencesError
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <ProductCreateForm
          defaultChannel={sales_channel}
          store={store}
          pricePreferences={price_preferences}
          regions={regions}
        />
      )}
    </RouteFocusModal>
  )
}
