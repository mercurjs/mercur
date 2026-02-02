import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useOrder } from "@hooks/api"
import { DEFAULT_FIELDS } from "../constants"
import { EditOrderShippingAddressForm } from "./_components/edit-order-shipping-address-form"

export const Component = () => {
  const { t } = useTranslation()
  const params = useParams()

  const { order, isPending, isError } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  })

  if (!isPending && isError) {
    throw new Error("Order not found")
  }

  return (
    <RouteDrawer data-testid="order-edit-shipping-address-drawer">
      <RouteDrawer.Header data-testid="order-edit-shipping-address-header">
        <Heading data-testid="order-edit-shipping-address-heading">
          {t("orders.edit.shippingAddress.title")}
        </Heading>
      </RouteDrawer.Header>

      {order && <EditOrderShippingAddressForm order={order} />}
    </RouteDrawer>
  )
}
