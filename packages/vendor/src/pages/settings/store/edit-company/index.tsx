import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "@components/modals"
import { useStore } from "@hooks/api/store"
import { EditStoreCompanyForm } from "./_components/edit-store-company-form"

const StoreCompanyEdit = () => {
  const { t } = useTranslation()
  const { store, isPending: isLoading, isError, error } = useStore()

  if (isError) {
    throw error
  }

  const ready = !!store && !isLoading

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("store.editCompany.header", "Edit Company")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditStoreCompanyForm store={store} />}
    </RouteDrawer>
  )
}

export const Component = StoreCompanyEdit
