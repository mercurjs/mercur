import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const OfferListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading>{t("offers.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("offers.subtitle")}
      </Text>
    </div>
  )
}

export const OfferListActions = () => {
  const { t } = useTranslation()

  return (
    <Button size="small" variant="secondary" asChild>
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
