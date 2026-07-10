import { OrderAddresses } from "@/components/organisms/OrderAddresses/OrderAddresses"
import { OrderParcels } from "@/components/organisms/OrderParcels/OrderParcels"
import { OrderTotals } from "@/components/organisms/OrderTotals/OrderTotals"

export const OrderDetailsSection = ({ orderSet }: { orderSet: any }) => {
  return (
    <div>
      <OrderParcels orders={orderSet.orders} />
      <OrderTotals orderSet={orderSet} />
      {/* <OrderAddresses /> */}
    </div>
  )
}
