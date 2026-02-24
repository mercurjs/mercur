import { useParams } from "react-router-dom"

import { AdminApiKeyResponse, AdminSalesChannelResponse } from "@medusajs/types"
import { RouteFocusModal } from "../../../components/modals"
import { useApiKey } from "../../../hooks/api/api-keys"
import { ApiKeySalesChannelsForm } from "./components/api-key-sales-channels-form"

export const ApiKeyManagementAddSalesChannels = () => {
  const { id } = useParams()

  const { api_key, isLoading, isError, error } = useApiKey(id!)

  const preSelected = (
    api_key as AdminApiKeyResponse["api_key"] & {
      sales_channels: AdminSalesChannelResponse["sales_channel"][] | null
    }
  )?.sales_channels?.map((sc) => sc.id)

  const ready = !isLoading && api_key

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal data-testid="publishable-api-key-sales-channels-modal">
      {ready && (
        <ApiKeySalesChannelsForm apiKey={id!} preSelected={preSelected} />
      )}
    </RouteFocusModal>
  )
}
