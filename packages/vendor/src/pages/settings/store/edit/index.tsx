import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "@components/modals"
import { useStore } from "@hooks/api/store"
import { EditStoreForm } from "./_components/edit-store-form"

const StoreEdit = () => {
  const { t } = useTranslation()
  const { store, isPending: isLoading, isError, error } = useStore()

  if (isError) {
    throw error
  }

  const ready = !!store && !isLoading

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("store.edit.header", "Edit Store")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditStoreForm store={store} />}
    </RouteDrawer>
  )
}

export const Component = StoreEdit
