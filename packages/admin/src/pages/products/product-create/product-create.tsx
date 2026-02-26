import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "../../../components/modals"
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

  const ready =
    !!store &&
    !isStorePending &&
    !!sales_channel &&
    !isSalesChannelPending

  if (isStoreError) {
    throw storeError
  }

  if (isSalesChannelError) {
    throw salesChannelError
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
        />
      )}
    </RouteFocusModal>
  )
}
