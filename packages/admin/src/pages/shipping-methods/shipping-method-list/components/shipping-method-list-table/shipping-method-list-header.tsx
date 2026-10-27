import { Button, Heading, Text } from "@medusajs/ui"
import { PermissionGuard } from "@mercurjs/dashboard-shared"
import { Children, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const ShippingMethodListTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="shipping-method-list-heading">
        {t("shippingMethods.domain")}
      </Heading>
      <Text
        className="text-ui-fg-subtle"
        size="small"
        data-testid="shipping-method-list-subtitle"
      >
        {t("shippingMethods.subtitle")}
      </Text>
    </div>
  )
}

export const ShippingMethodListActions = ({
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
        <PermissionGuard permission="shipping_rules:edit">
          <Button
            size="small"
            variant="secondary"
            asChild
            data-testid="shipping-method-list-create-button"
          >
            <Link to="create">{t("actions.create")}</Link>
          </Button>
        </PermissionGuard>
      )}
    </div>
  )
}

export const ShippingMethodListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="shipping-method-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ShippingMethodListTitle />
          <ShippingMethodListActions />
        </>
      )}
    </div>
  )
}
