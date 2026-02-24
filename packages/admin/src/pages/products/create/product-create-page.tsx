import { Children, ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"
import { useSalesChannels } from "@hooks/api"
import { useStore } from "@hooks/api/store"

import { ProductCreateForm } from "./product-create-form/product-create-form"
import { ProductCreateDetailsForm } from "./product-create-details-form"
import { ProductCreateOrganizeForm } from "./product-create-organize-form"
import { ProductCreateVariantsForm } from "./product-create-variants-form"
import { ProductCreateInventoryKitForm } from "./product-create-inventory-kit-form"
import { TabbedForm } from "@components/tabbed-form"
import { HttpTypes } from "@mercurjs/types"

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation()

  const { store, isPending: isStorePending } = useStore()
  const { sales_channels, isPending: isSalesChannelPending } =
    useSalesChannels()

  const ready =
    !!store && !isStorePending && !!sales_channels && !isSalesChannelPending

  const defaultChannel = sales_channels?.[0] as
    | HttpTypes.AdminSalesChannel
    | undefined

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {ready && (
        Children.count(children) > 0 ? (
          children
        ) : (
          <ProductCreateForm defaultChannel={defaultChannel} />
        )
      )}
    </RouteFocusModal>
  )
}

export const ProductCreatePage = Object.assign(Root, {
  DetailsForm: ProductCreateDetailsForm,
  OrganizeForm: ProductCreateOrganizeForm,
  VariantsForm: ProductCreateVariantsForm,
  InventoryKitForm: ProductCreateInventoryKitForm,
  Form: ProductCreateForm,
  Tab: TabbedForm.Tab,
})
