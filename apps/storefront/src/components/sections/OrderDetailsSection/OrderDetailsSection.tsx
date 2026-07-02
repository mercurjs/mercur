import { OrderParcels } from "@/components/organisms/OrderParcels/OrderParcels"
import { OrderTotals } from "@/components/organisms/OrderTotals/OrderTotals"
import { StoreOrderGroup } from "@/lib/data/orders"

export const OrderDetailsSection = ({
  orderGroup,
}: {
  orderGroup: StoreOrderGroup
}) => {
  return (
    <div>
      <OrderParcels orders={orderGroup.orders} />
      <OrderTotals orderGroup={orderGroup} />
    </div>
  )
}
