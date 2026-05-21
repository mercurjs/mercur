import { Buildings, CurrencyDollar, PencilSquare, Trash } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../components/common/action-menu"
import { useDeleteOfferAction } from "../common/hooks/use-delete-offer-action"

type OfferActionRow = {
  id: string
  sku: string
}

export const OfferActions = ({ offer }: { offer: OfferActionRow }) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteOfferAction({ id: offer.id, sku: offer.sku })

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `${offer.id}/edit`,
            },
            {
              icon: <CurrencyDollar />,
              label: t("offers.actions.manage_prices"),
              to: `${offer.id}/pricing`,
            },
            {
              icon: <Buildings />,
              label: t("offers.actions.manage_inventory"),
              to: `${offer.id}/inventory`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}
