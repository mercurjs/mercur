import { Buildings } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { OfferDTO } from "@mercurjs/types"

import { NoRecords } from "../../../../../../components/common/empty-table-content"

/**
 * Sidebar "Shipping Configuration" card of the read-only admin Offer
 * Variant detail (SPEC-010). Mirrors the offer detail's card shape but is
 * **read-only** — no Edit kebab, no link. Renders the offer's shipping
 * profile name/type, or an empty state.
 */
export const OfferVariantShippingSection = ({
  offer,
}: {
  offer: Pick<OfferDTO, "shipping_profile">
}) => {
  const { t } = useTranslation()
  const profile = offer.shipping_profile

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.detail.shippingConfiguration")}</Heading>
      </div>
      {profile?.name ? (
        <div className="txt-small flex flex-col gap-2 px-2 pb-2">
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2">
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
            </div>
          </div>
        </div>
      ) : (
        <NoRecords className="h-40" />
      )}
    </Container>
  )
}
