import { useParams } from "react-router-dom"

import { useOrder } from "../../../hooks/api/orders"
import { RouteFocusModal } from "../../../components/modals"
import { useWarehouseCapabilityGuard } from "../../../hooks/use-warehouse-capability-guard"
import { OrderAllocateItemsForm } from "./components/order-create-fulfillment-form"

export function OrderAllocateItems() {
  const { id } = useParams()
  const warehouseAvailable = useWarehouseCapabilityGuard()

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields:
        "currency_code,*items,*items.variant,+items.variant.product.title,*items.variant.inventory,*items.variant.inventory.location_levels,*items.variant.inventory_items,*shipping_address",
    },
    { enabled: warehouseAvailable }
  )

  if (isError) {
    throw error
  }

  const ready = warehouseAvailable && !isLoading && order

  return (
    <RouteFocusModal data-testid="order-allocate-items-modal">
      {ready && <OrderAllocateItemsForm order={order} />}
    </RouteFocusModal>
  )
}
