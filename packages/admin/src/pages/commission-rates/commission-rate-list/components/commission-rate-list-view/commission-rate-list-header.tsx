import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const CommissionRateListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("commissionRates.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("commissionRates.description")}
      </Text>
    </div>
  )
}

export const CommissionRateListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-x-2">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <Link to="/settings/commission-rates/create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const CommissionRateListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CommissionRateListTitle />
          <CommissionRateListActions />
        </>
      )}
    </div>
  )
}
