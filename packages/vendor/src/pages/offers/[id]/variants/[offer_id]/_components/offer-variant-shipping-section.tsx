import { Buildings, PencilSquare } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../../components/common/empty-table-content"
import { SidebarLink } from "../../../../../../components/common/sidebar-link/sidebar-link"

type OfferShippingData = {
  shipping_profile?: {
    id?: string | null
    name?: string | null
    type?: string | null
  } | null
}

export const OfferVariantShippingSection = ({
  offer,
}: {
  offer: OfferShippingData
}) => {
  const { t } = useTranslation()
  const profile = offer.shipping_profile

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.shippingConfiguration")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "shipping",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      {profile?.name ? (
        <SidebarLink
          to={`/settings/locations/shipping-profiles/${profile.id}`}
          labelKey={profile.name}
          descriptionKey={profile.type ?? ""}
          icon={<Buildings />}
          dataTestid="offer-variant-shipping-link"
        />
      ) : (
        <NoRecords className="h-40" />
      )}
      <DisplayExtensionZone model="offer" zone="shipping" data={offer} />
    </Container>
  )
}
