import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const ProductTypeListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading data-testid="product-type-list-table-heading">
        {t("productTypes.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="product-type-list-table-subtitle"
      >
        {t("productTypes.subtitle")}
      </Text>
    </div>
  )
}

export const ProductTypeListActions = ({
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
          size="small"
          variant="secondary"
          asChild
          data-testid="product-type-list-table-create-button"
        >
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const ProductTypeListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="product-type-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductTypeListTitle />
          <ProductTypeListActions />
        </>
      )}
    </div>
  )
}
