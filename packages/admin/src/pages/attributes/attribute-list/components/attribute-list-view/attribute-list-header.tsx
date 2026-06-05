import { Children, ReactNode } from "react"
import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const AttributeListTitle = () => {
  const { t } = useTranslation()
  return (
    <Heading data-testid="attribute-list-table-heading">
      {t("attributes.list.title")}
    </Heading>
  )
}

export const AttributeListActions = ({
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
        <Button
          variant="secondary"
          size="small"
          asChild
          data-testid="attribute-list-table-create-button"
        >
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const AttributeListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="attribute-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <AttributeListTitle />
          <AttributeListActions />
        </>
      )}
    </div>
  )
}
