import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"

export type CategoryWithShippingProfile = HttpTypes.AdminProductCategory & {
  default_shipping_profile?: { id: string; name: string } | null
}

type CategoryShippingSectionProps = {
  category: CategoryWithShippingProfile
}

export const CategoryShippingSection = ({
  category,
}: CategoryShippingSectionProps) => {
  const { t } = useTranslation()

  const shippingProfile = category.default_shipping_profile

  return (
    <Container className="divide-y p-0" data-testid="category-shipping-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="category-shipping-section-heading">
          {t("categories.shippingProfile.header")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("categories.shippingProfile.action"),
                  icon: <PencilSquare />,
                  to: "shipping-profile",
                  permission: "product_categories:edit",
                },
              ],
            },
          ]}
          data-testid="category-shipping-section-action-menu"
        />
      </div>
      <div className="flex flex-col gap-y-2 px-6 py-4">
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start gap-3">
          <Text size="small" leading="compact" weight="plus">
            {t("categories.shippingProfile.label")}
          </Text>
          {shippingProfile ? (
            <Link
              to={`/settings/locations/shipping-profiles/${shippingProfile.id}`}
              className="txt-compact-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover truncate outline-none"
              data-testid="category-shipping-section-profile-link"
            >
              {shippingProfile.name}
            </Link>
          ) : (
            <Text
              size="small"
              leading="compact"
              data-testid="category-shipping-section-profile-empty"
            >
              -
            </Text>
          )}
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          {t("categories.shippingProfile.hint")}
        </Text>
      </div>
    </Container>
  )
}
