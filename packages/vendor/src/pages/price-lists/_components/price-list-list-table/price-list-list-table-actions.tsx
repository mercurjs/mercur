
import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"

import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { useDeletePriceListAction } from "@pages/price-lists/common/hooks/use-delete-price-list-action"

type PriceListListTableActionsProps = {
  priceList: HttpTypes.AdminPriceList
}

export const PriceListListTableActions = ({
  priceList,
}: PriceListListTableActionsProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeletePriceListAction({
    priceList,
  })

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              permission: "price_lists:edit",
              label: t("actions.edit"),
              to: `${priceList.id}/edit`,
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              permission: "price_lists:manage",
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  )
}
