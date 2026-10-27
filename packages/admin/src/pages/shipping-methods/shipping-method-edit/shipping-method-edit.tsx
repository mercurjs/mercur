import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useShippingMethod } from "../../../hooks/api/shipping-methods"
import { EditShippingMethodForm } from "./components/edit-shipping-method-form"

export const ShippingMethodEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { shipping_method, isPending, isError, error } = useShippingMethod(id!)

  const ready = !isPending && !!shipping_method

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading data-testid="shipping-method-edit-heading">
            {t("shippingMethods.edit.header")}
          </Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && <EditShippingMethodForm method={shipping_method} />}
    </RouteDrawer>
  )
}
