import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { RouteDrawer } from "../../../components/modals"
import { useStore } from "../../../hooks/api/store"
import { EditMarketplaceForm } from "./components/edit-marketplace-form/edit-marketplace-form"

export const MarketplaceEdit = () => {
  const { t } = useTranslation()
  const { store, isPending: isLoading, isError, error } = useStore()

  if (isError) {
    throw error
  }

  const ready = !!store && !isLoading

  return (
    <RouteDrawer data-testid="store-edit">
      <RouteDrawer.Header data-testid="store-edit-header">
        <Heading data-testid="store-edit-heading">{t("marketplace.edit.header")}</Heading>
      </RouteDrawer.Header>
      {ready && <EditMarketplaceForm store={store} />}
    </RouteDrawer>
  )
}
