import { Children, ReactNode } from "react"
import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const ProductTagListTitle = () => {
  const { t } = useTranslation()
  return (
    <Heading data-testid="product-tag-list-table-heading">
      {t("productTags.domain")}
    </Heading>
  )
}

export const ProductTagListActions = ({
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
          data-testid="product-tag-list-table-create-button"
        >
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const ProductTagListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="product-tag-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductTagListTitle />
          <ProductTagListActions />
        </>
      )}
    </div>
  )
}
