import { OrderCancel } from "@/components/cells/OrderCancel/OrderCancel"
import { OrderReturn } from "@/components/cells/OrderReturn/OrderReturn"
import { OrderTrack } from "@/components/cells/OrderTrack/OrderTrack"

export const OrderParcelActions = ({ order }: { order: any }) => {
  // if (order.status === "pending") return <OrderCancel order={order} />
  if (order.fulfillment_status === "delivered")
    return <OrderReturn order={order} />

  if (order.fulfillment_status === "shipped")
    return <OrderTrack order={order} />

  return null
}
