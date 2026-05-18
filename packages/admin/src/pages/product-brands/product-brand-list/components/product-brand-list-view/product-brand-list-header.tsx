import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const ProductBrandListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading data-testid="product-brand-list-table-heading">
        {t("productBrands.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="product-brand-list-table-subtitle"
      >
        {t("productBrands.subtitle")}
      </Text>
    </div>
  )
}

export const ProductBrandListActions = ({
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
          data-testid="product-brand-list-table-create-button"
        >
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const ProductBrandListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="product-brand-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductBrandListTitle />
          <ProductBrandListActions />
        </>
      )}
    </div>
  )
}
