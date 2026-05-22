import { BuildingStorefront } from "@medusajs/icons"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../components/common/action-menu"

type OfferActionRow = {
  id: string
  sellerId: string | null
}

export const OfferActions = ({ offer }: { offer: OfferActionRow }) => {
  const { t } = useTranslation()

  if (!offer.sellerId) {
    return null
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <BuildingStorefront />,
              label: t("offers.actions.openStore"),
              to: `/stores/${offer.sellerId}`,
            },
          ],
        },
      ]}
    />
  )
}
