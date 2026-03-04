import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const TaxRegionListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading>{t("taxes.domain")}</Heading>
      <Text size="small" className="text-pretty text-ui-fg-subtle">
        {t("taxRegions.list.hint")}
      </Text>
    </div>
  )
}

export const TaxRegionListActions = ({
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
        <Link to="create">
          <Button size="small" variant="secondary">
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const TaxRegionListHeader = ({
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
          <TaxRegionListTitle />
          <TaxRegionListActions />
        </>
      )}
    </div>
  )
}
