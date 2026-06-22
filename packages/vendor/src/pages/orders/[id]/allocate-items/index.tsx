// Route: /orders/:id/allocate-items
import { useParams } from "react-router-dom"

import { useOrder } from "@hooks/api/orders"
import { RouteFocusModal } from "@components/modals"
import { OrderAllocateItemsForm } from "./order-create-fulfillment-form"

export const Component = () => {
  const { id } = useParams()

  const { order, isLoading, isError, error } = useOrder(id!, {
    // `*foo,*foo.bar` or `+foo.bar.baz` makes Medusa's query parser try
    // to look up a literal property `*items` / `+items` on Order and
    // 500. Use `<rel>.*` plus bare scalar names.
    fields:
      "currency_code,items.*,items.variant.*,items.variant.product.title,items.offer.*,items.offer.inventory_item_link.*,items.offer.inventory_item_link.required_quantity,items.offer.inventory_item_link.inventory_item.*,items.offer.inventory_item_link.inventory_item.location_levels.*,shipping_address.*",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && order

  return (
    <RouteFocusModal>
      {ready && <OrderAllocateItemsForm order={order} />}
    </RouteFocusModal>
  )
}
