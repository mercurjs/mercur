import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { PencilSquare, Trash } from "@medusajs/icons"

import { useDeleteShippingOptionTypeAction } from "@pages/shipping-option-types/_common/hooks/use-delete-shipping-option-type-action"

import type { HttpTypes } from "@medusajs/types"

type ShippingOptionTypeRowActionsProps = {
  shippingOptionType: HttpTypes.AdminShippingOptionType
}

export const ShippingOptionTypeRowActions = ({
  shippingOptionType,
}: ShippingOptionTypeRowActionsProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteShippingOptionTypeAction(
    shippingOptionType.id,
    shippingOptionType.label
  )

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `/settings/locations/shipping-option-types/${shippingOptionType.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              icon: <Trash />,
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`shipping-option-type-list-table-action-menu-${shippingOptionType.id}`}
    />
  )
}
