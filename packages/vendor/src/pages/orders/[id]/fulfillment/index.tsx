// Route: /orders/:id/fulfillment
import { useParams, useSearchParams } from "react-router-dom"

import { RouteFocusModal } from "@components/modals"
import { useOrder } from "@hooks/api/orders"
import { OrderCreateFulfillmentForm } from "./order-create-fulfillment-form"

export const Component = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requiresShipping = searchParams.get("requires_shipping") === "true"

  const { order, isLoading, isError, error } = useOrder(id!, {
    // `*foo,*foo.bar` or `+foo.bar.baz` makes Medusa's query parser try
    // to look up a literal property `*items` / `+items` on Order and
    // 500. Use `<rel>.*` plus bare scalar names.
    fields:
      "currency_code,items.*,items.variant.*,items.variant.product.shipping_profile.id,items.offer.shipping_profile_id,shipping_address.*,shipping_methods.shipping_option_id,no_notification",
  })

  if (isError) {
    throw error
  }

  const ready = !isLoading && order

  return (
    <RouteFocusModal>
      {ready && (
        <OrderCreateFulfillmentForm
          order={order}
          requiresShipping={requiresShipping}
        />
      )}
    </RouteFocusModal>
  )
}
