import { PencilSquare, Trash } from "@medusajs/icons"
import type { ShippingZoneDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteShippingZoneAction } from "../../../common/hooks/use-delete-shipping-zone-action"

export const ShippingZoneRowActions = ({ zone }: { zone: ShippingZoneDTO }) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteShippingZoneAction(zone.id, zone.name)

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              permission: "shipping_rules:edit",
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `/settings/locations/shipping-zones/${zone.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              permission: "shipping_rules:manage",
              label: t("actions.delete"),
              icon: <Trash />,
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`shipping-zone-list-action-menu-${zone.id}`}
    />
  )
}
