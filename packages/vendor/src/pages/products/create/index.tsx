// Route: /products/create
import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "@components/modals"
import { useSalesChannels } from "@hooks/api"
import { useStore } from "@hooks/api/store"
import { ProductCreateForm } from "./product-create-form/product-create-form"

export const Component = () => {
  const { t } = useTranslation()

  const { store, isPending: isStorePending } = useStore()

  const { sales_channels, isPending: isSalesChannelPending } =
    useSalesChannels()

  const ready =
    !!store && !isStorePending && !!sales_channels && !isSalesChannelPending

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        <ProductCreateForm defaultChannel={sales_channels[0]} store={store} />
      )}
    </RouteFocusModal>
  )
}
