import { useParams, useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "../../../components/modals"
import { useOrder } from "../../../hooks/api/orders"
import { useWarehouseCapabilityGuard } from "../../../hooks/use-warehouse-capability-guard"
import { OrderCreateFulfillmentForm } from "./components/order-create-fulfillment-form"

export function OrderCreateFulfillment() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requiresShipping = searchParams.get("requires_shipping") === "true"
  const warehouseAvailable = useWarehouseCapabilityGuard()

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields:
        "currency_code,*items,*items.variant,+items.variant.product.shipping_profile.id,*shipping_address,+shipping_methods.shipping_option_id",
    },
    { enabled: warehouseAvailable }
  )

  if (isError) {
    throw error
  }

  const ready = warehouseAvailable && !isLoading && order

  return (
    <RouteFocusModal data-testid="order-create-fulfillment-modal">
      {ready && (
        <OrderCreateFulfillmentForm
          order={order}
          requiresShipping={requiresShipping}
        />
      )}
    </RouteFocusModal>
  )
}
