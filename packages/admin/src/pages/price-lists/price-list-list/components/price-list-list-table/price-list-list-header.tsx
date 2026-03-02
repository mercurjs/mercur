import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const PriceListListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("priceLists.domain")}</Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("priceLists.subtitle")}
      </Text>
    </div>
  )
}

export const PriceListListActions = ({
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
        <Button size="small" variant="secondary" asChild>
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const PriceListListHeader = ({
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
          <PriceListListTitle />
          <PriceListListActions />
        </>
      )}
    </div>
  )
}
