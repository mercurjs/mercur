import { PencilSquare, Trash } from "@medusajs/icons"

import { InventoryTypes, StockLocationDTO } from "@medusajs/types"
import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { useDeleteInventoryItemLevel } from "@hooks/api/inventory"

type LocationActionsLevel = InventoryTypes.InventoryLevelDTO & {
  stock_locations?: StockLocationDTO[]
}

export const LocationActions = ({ level }: { level: LocationActionsLevel }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteInventoryItemLevel(
    level.inventory_item_id,
    level.location_id
  )

  const locationName =
    level.stock_locations?.map((location) => location.name).join(", ") ?? ""

  const handleDelete = async () => {
    const res = await prompt({
      title: t("inventory.level.deleteTitle"),
      description: t("inventory.level.deleteDescription", {
        location: locationName,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => toast.success(t("inventory.levelDeleted")),
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `locations/${level.location_id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
              disabled:
                level.reserved_quantity > 0 || level.stocked_quantity > 0,
            },
          ],
        },
      ]}
    />
  )
}
