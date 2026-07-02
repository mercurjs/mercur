import { Card, Divider } from "@/components/atoms"
import { StoreOrderGroup } from "@/lib/data/orders"
import { convertToLocale } from "@/lib/helpers/money"

export const OrderTotals = ({ orderGroup }: { orderGroup: StoreOrderGroup }) => {
  const orders = orderGroup.orders ?? []
  const delivery = orders.reduce(
    (sum, order) => sum + (order.shipping_total ?? 0),
    0
  )
  const total = orderGroup.total
  const subtotal = total - delivery

  const currency_code =
    orderGroup.currency_code ?? orders[0]?.currency_code ?? ""

  return (
    <Card className="mb-8 p-4">
      <p className="text-secondary label-md mb-2 flex justify-between">
        Subtotal:
        <span className="text-primary">
          {convertToLocale({
            amount: subtotal,
            currency_code,
          })}
        </span>
      </p>
      <p className="text-secondary label-md flex justify-between">
        Delivery:
        <span className="text-primary">
          {convertToLocale({
            amount: delivery,
            currency_code,
          })}
        </span>
      </p>
      <Divider className="my-4" />
      <p className="text-secondary label-md flex justify-between items-center">
        Total:{" "}
        <span className="text-primary heading-md">
          {convertToLocale({
            amount: total,
            currency_code,
          })}
        </span>
      </p>
    </Card>
  )
}
