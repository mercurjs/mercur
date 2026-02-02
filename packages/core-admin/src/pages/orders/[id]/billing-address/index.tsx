import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useOrder } from "@hooks/api"
import { DEFAULT_FIELDS } from "../constants"
import { EditOrderBillingAddressForm } from "./_components/edit-order-billing-address-form"

export const Component = () => {
  const { t } = useTranslation()
  const params = useParams()

  const { order, isPending, isError, error } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  })

  if (!isPending && isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="order-edit-billing-address-drawer">
      <RouteDrawer.Header data-testid="order-edit-billing-address-header">
        <Heading data-testid="order-edit-billing-address-heading">
          {t("orders.edit.billingAddress.title")}
        </Heading>
      </RouteDrawer.Header>

      {order && <EditOrderBillingAddressForm order={order} />}
    </RouteDrawer>
  )
}
