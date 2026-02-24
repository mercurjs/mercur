import { PencilSquare, ShoppingBag } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "../../../../../components/common/sidebar-link/sidebar-link"
import { ActionMenu } from "../../../../../components/common/action-menu"

type ProductShippingProfileSectionProps = {
  product: HttpTypes.AdminProduct & {
    shipping_profile: HttpTypes.AdminShippingProfile
  }
}

export const ProductShippingProfileSection = ({
  product,
}: ProductShippingProfileSectionProps) => {
  const { t } = useTranslation()

  const shippingProfile = product.shipping_profile

  return (
    <Container className="p-0" data-testid="product-shipping-profile-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="product-shipping-profile-header">
        <Heading level="h2" data-testid="product-shipping-profile-title">{t("products.shippingProfile.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "shipping-profile",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="product-shipping-profile-action-menu"
        />
      </div>

      {shippingProfile && (
        <div data-testid="product-shipping-profile-link-container">
          <SidebarLink
            to={`/settings/locations/shipping-profiles/${shippingProfile.id}`}
            labelKey={shippingProfile.name}
            descriptionKey={shippingProfile.type}
            icon={<ShoppingBag />}
            data-testid="product-shipping-profile-link"
          />
        </div>
      )}
    </Container>
  )
}
