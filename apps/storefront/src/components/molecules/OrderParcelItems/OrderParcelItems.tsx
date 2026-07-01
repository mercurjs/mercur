import { OrderProductListItem } from "@/components/cells"

export const OrderParcelItems = ({
  items,
  currency_code,
}: {
  items: any[]
  currency_code: string
}) => {
  return (
    <>
      {items.map((item) => (
        <OrderProductListItem
          key={item.id + item.variant_id}
          item={item}
          currency_code={currency_code}
        />
      ))}
    </>
  )
}
