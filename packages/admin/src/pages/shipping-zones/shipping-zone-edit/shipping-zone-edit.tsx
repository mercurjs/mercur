import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useShippingZone } from "../../../hooks/api/shipping-zones"
import { EditShippingZoneForm } from "./components/edit-shipping-zone-form"

export const ShippingZoneEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { shipping_zone, isPending, isError, error } = useShippingZone(id!)

  const ready = !isPending && !!shipping_zone

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading data-testid="shipping-zone-edit-heading">
            {t("shippingZones.edit.header")}
          </Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {ready && <EditShippingZoneForm zone={shipping_zone} />}
    </RouteDrawer>
  )
}
