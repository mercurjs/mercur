import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useShippingOptionType } from "../../../hooks/api"
import { EditShippingOptionTypeForm } from "./components/edit-shipping-option-type-form"

export const ShippingOptionTypeEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { shipping_option_type, isPending, isError, error } =
    useShippingOptionType(id!)

  const ready = !isPending && !!shipping_option_type

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="shipping-option-type-edit-drawer">
      <RouteDrawer.Header data-testid="shipping-option-type-edit-drawer-header">
        <Heading data-testid="shipping-option-type-edit-drawer-heading">{t("shippingOptionTypes.edit.header")}</Heading>
      </RouteDrawer.Header>
      {ready && (
        <EditShippingOptionTypeForm shippingOptionType={shipping_option_type} />
      )}
    </RouteDrawer>
  )
}
