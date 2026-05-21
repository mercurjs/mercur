import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const OfferListTitle = () => {
  const { t } = useTranslation()

  return <Heading>{t("offers.domain")}</Heading>
}

export const OfferListActions = () => {
  const { t } = useTranslation()

  return (
    <Button size="small" variant="primary" asChild>
      <Link to="create" data-testid="offer-list-create-button">
        {t("offers.actions.create")}
      </Link>
    </Button>
  )
}

export const OfferListHeader = () => (
  <div className="flex items-center justify-between px-6 py-4">
    <OfferListTitle />
    <OfferListActions />
  </div>
)
