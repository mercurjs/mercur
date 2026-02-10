// Route: /orders/:id/fulfillments/:f_id/shipment
import { useParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useOrder } from "@hooks/api/orders"
import { OrderCreateShipmentForm } from "./order-create-shipment-form"

export const Component = () => {
  const { id, f_id } = useParams()

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields: "*fulfillments,*fulfillments.items,*fulfillments.labels",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && order

  const fulfillment = order?.fulfillments?.find((f) => f.id === f_id)

  return (
    <RouteFocusModal>
      {ready && fulfillment && (
        <OrderCreateShipmentForm
          order={order}
          fulfillment={fulfillment}
        />
      )}
    </RouteFocusModal>
  )
}
