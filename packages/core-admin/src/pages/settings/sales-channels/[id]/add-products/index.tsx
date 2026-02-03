import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useSalesChannel } from "@hooks/api/sales-channels"

import { AddProductsToSalesChannelForm } from "./_components/add-products-to-sales-channel-form"

const SalesChannelAddProducts = () => {
  const { id } = useParams()
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
    <RouteFocusModal data-testid="sales-channel-add-products-modal">
      {!isLoading && sales_channel && (
        <AddProductsToSalesChannelForm salesChannel={sales_channel} />
      )}
    </RouteFocusModal>
  )
}

export const Component = SalesChannelAddProducts
