import { useParams } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"

import { RouteFocusModal } from "../../../components/modals"
import { useOrder } from "../../../hooks/api/orders"
import { OrderCreateShipmentForm } from "./components/order-create-shipment-form"

export function OrderCreateShipment() {
  const { id, f_id } = useParams()

  const { order, isLoading, isError, error } = useOrder(id!, {
    fields: "*fulfillments,*fulfillments.items,*fulfillments.labels",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && order

  return (
    <RouteFocusModal data-testid="order-create-shipment-modal">
      {ready && (
        <OrderCreateShipmentForm
          order={order}
          fulfillment={order.fulfillments?.find((f: HttpTypes.AdminOrderFulfillment) => f.id === f_id)}
        />
      )}
    </RouteFocusModal>
  )
}
