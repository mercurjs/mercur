import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const RegionListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading data-testid="region-list-table-heading">
        {t("regions.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="region-list-table-subtitle"
      >
        {t("regions.subtitle")}
      </Text>
    </div>
  )
}

export const RegionListActions = ({
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
        <Link to="/settings/regions/create">
          <Button
            size="small"
            variant="secondary"
            data-testid="region-list-table-create-button"
          >
            {t("actions.create")}
          </Button>
        </Link>
      )}
    </div>
  )
}

export const RegionListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="region-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <RegionListTitle />
          <RegionListActions />
        </>
      )}
    </div>
  )
}
