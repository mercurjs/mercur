import { Buildings, PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../../components/common/empty-table-content"

type OfferShippingData = {
  shipping_profile?: { name?: string | null; type?: string | null } | null
}

/**
 * Sidebar "Shipping Configuration" card of the Offer Variant detail
 * (Figma `40016503:749900`): the offer's shipping profile + an Edit
 * Shipping Configuration kebab.
 */
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
        <div className="px-2 pb-2">
          <div className="shadow-elevation-card-rest bg-ui-bg-component flex items-center gap-3 rounded-md px-4 py-3">
            <div className="text-ui-fg-subtle">
              <Buildings />
            </div>
            <div className="flex flex-col overflow-hidden">
              <Text
                size="small"
                leading="compact"
                weight="plus"
                className="truncate"
              >
                {profile.name}
              </Text>
              {profile.type && (
                <Text size="small" className="text-ui-fg-subtle truncate">
                  {profile.type}
                </Text>
              )}
            </div>
          </div>
        </div>
      ) : (
        <NoRecords className="h-40" />
      )}
    </Container>
  )
}
