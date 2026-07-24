import { OrderAddresses } from "@/components/organisms/OrderAddresses/OrderAddresses"
import { OrderParcels } from "@/components/organisms/OrderParcels/OrderParcels"
import { OrderTotals } from "@/components/organisms/OrderTotals/OrderTotals"

export const OrderDetailsSection = ({ orderGroup }: { orderGroup: any }) => {
  return (
    <div>
      <OrderParcels orders={orderGroup.orders} />
      <OrderTotals orderGroup={orderGroup} />
    </div>
  )
}
