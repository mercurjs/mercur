import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"
import { useRegions } from "@hooks/api"
import { usePricePreferences } from "@hooks/api/price-preferences"
import { useSalesChannel } from "@hooks/api/sales-channels"
import { useStore } from "@hooks/api/store"

import { useProductCreateContext } from "./product-create-context"
import { ProductCreateFormWrapper } from "./product-create-form-wrapper"
import { Form } from "./product-create-form"
import { DetailsTab } from "./product-create-details-tab"
import { OrganizeTab } from "./product-create-organize-tab"
import { VariantsTab } from "./product-create-variants-tab"
import { InventoryTab } from "./product-create-inventory-tab"
import { Footer } from "./product-create-footer"

// ─── Root Component ──────────────────────────────────────────

export interface ProductCreatePageProps {
  children?: ReactNode
}

function ProductCreatePageRoot({ children }: ProductCreatePageProps) {
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

  if (isStoreError) throw storeError
  if (isRegionsError) throw regionsError
  if (isSalesChannelError) throw salesChannelError
  if (isPricePreferencesError) throw pricePreferencesError

  if (!ready) {
    return (
      <RouteFocusModal>
        <RouteFocusModal.Title asChild>
          <span className="sr-only">{t("products.create.title")}</span>
        </RouteFocusModal.Title>
        <RouteFocusModal.Description asChild>
          <span className="sr-only">{t("products.create.description")}</span>
        </RouteFocusModal.Description>
      </RouteFocusModal>
    )
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      <ProductCreateFormWrapper
        store={store}
        regions={regions}
        pricePreferences={price_preferences}
        defaultChannel={sales_channel}
      >
        {children}
      </ProductCreateFormWrapper>
    </RouteFocusModal>
  )
}

// Compound component export
export const ProductCreatePage = Object.assign(ProductCreatePageRoot, {
  Form,
  DetailsTab,
  OrganizeTab,
  VariantsTab,
  InventoryTab,
  Footer,
  useContext: useProductCreateContext,
})
