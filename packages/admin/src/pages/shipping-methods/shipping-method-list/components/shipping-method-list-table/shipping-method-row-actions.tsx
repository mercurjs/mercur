import { PencilSquare, Trash } from "@medusajs/icons"
import type { MarketplaceShippingMethodDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteShippingMethodAction } from "../../../common/hooks/use-delete-shipping-method-action"

export const ShippingMethodRowActions = ({
  method,
}: {
  method: MarketplaceShippingMethodDTO
}) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteShippingMethodAction(method.id, method.name)

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              permission: "shipping_rules:edit",
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `/settings/locations/shipping-methods/${method.id}/edit`,
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
      data-testid={`shipping-method-list-action-menu-${method.id}`}
    />
  )
}
