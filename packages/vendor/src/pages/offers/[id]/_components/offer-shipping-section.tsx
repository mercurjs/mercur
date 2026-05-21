import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../components/common/section"
import { OfferDetail } from "../../common/types"

type Props = { offer: OfferDetail }

export const OfferShippingSection = ({ offer }: Props) => {
  const { t } = useTranslation()
  const profile = offer.shipping_profile

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-shipping-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("offers.fields.shippingProfile")}</Heading>
      </div>
      <SectionRow title={t("fields.name")} value={profile?.name ?? "-"} />
      <SectionRow title={t("fields.type")} value={profile?.type ?? "-"} />
    </Container>
  )
}
