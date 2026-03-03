import { Children, ReactNode } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const ShippingOptionTypeListTitle = () => {
  const { t } = useTranslation()
  return (
    <div>
      <Heading data-testid="shipping-option-type-list-table-heading">
        {t("shippingOptionTypes.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="shipping-option-type-list-table-subtitle"
      >
        {t("shippingOptionTypes.subtitle")}
      </Text>
    </div>
  )
}

export const ShippingOptionTypeListActions = ({
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
          data-testid="shipping-option-type-list-table-create-button"
        >
          <Link to="create">{t("actions.create")}</Link>
        </Button>
      )}
    </div>
  )
}

export const ShippingOptionTypeListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="shipping-option-type-list-table-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ShippingOptionTypeListTitle />
          <ShippingOptionTypeListActions />
        </>
      )}
    </div>
  )
}
