import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useSalesChannel } from "../../../hooks/api/sales-channels"
import { EditSalesChannelForm } from "./components/edit-sales-channel-form"

export const SalesChannelEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const {
    sales_channel,
    isPending: isLoading,
    isError,
    error,
  } = useSalesChannel(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="sales-channel-edit-drawer">
      <RouteDrawer.Header data-testid="sales-channel-edit-drawer-header">
        <Heading className="capitalize" data-testid="sales-channel-edit-drawer-heading">
          {t("salesChannels.editSalesChannel")}
        </Heading>
      </RouteDrawer.Header>
      {!isLoading && !!sales_channel && (
        <EditSalesChannelForm salesChannel={sales_channel} />
      )}
    </RouteDrawer>
  )
}
