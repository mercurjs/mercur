import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const OfferListTitle = () => {
  const { t } = useTranslation()

  return <Heading>{t("offers.domain")}</Heading>
}

export const OfferListActions = () => null

export const OfferListHeader = () => (
  <div className="flex items-center justify-between px-6 py-4">
    <OfferListTitle />
    <OfferListActions />
  </div>
)
