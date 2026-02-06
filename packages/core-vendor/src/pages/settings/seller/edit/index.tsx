import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "@components/modals"
import { useStore } from "@hooks/api/store"
import { EditSellerForm } from "./_components/edit-seller-form"

const SellerEdit = () => {
  const { t } = useTranslation()
  const { store, isPending: isLoading, isError, error } = useStore()

  if (isError) {
    throw error
  }

  const ready = !!store && !isLoading

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("seller.edit.header", "Edit Seller")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditSellerForm seller={store} />}
    </RouteDrawer>
  )
}

export const Component = SellerEdit
