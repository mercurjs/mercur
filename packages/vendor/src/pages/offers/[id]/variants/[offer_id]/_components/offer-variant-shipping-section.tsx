import { Buildings, PencilSquare, TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../../components/common/empty-table-content"

type OfferShippingData = {
  shipping_profile?: { name?: string | null; type?: string | null } | null
}

/**
 * Sidebar "Shipping Configuration" card of the Offer Variant detail
 * (Figma `40016503:749900`). Mirrors the offer detail's "Associated
 * product" card structure/size: an `Edit` kebab in the header and a
 * Pattern-A card (icon + name/subtitle + chevron) linking to the edit
 * drawer.
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
        <div className="txt-small flex flex-col gap-2 px-2 pb-2">
          <Link
            to="shipping"
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            data-testid="offer-variant-shipping-link"
          >
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="shadow-elevation-card-rest text-ui-fg-subtle flex size-7 items-center justify-center rounded-md">
                  <Buildings />
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="text-ui-fg-base truncate font-medium">
                    {profile.name}
                  </span>
                  {profile.type && (
                    <span className="text-ui-fg-subtle truncate">
                      {profile.type}
                    </span>
                  )}
                </div>
                <div className="size-7 flex items-center justify-center">
                  <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <NoRecords className="h-40" />
      )}
    </Container>
  )
}
