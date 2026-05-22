import { Component } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "../../../../components/common/section"
import { OfferDetail } from "../../common/types"

type Props = { offer: OfferDetail }

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return "-"
  }
}

export const OfferGeneralSection = ({ offer }: Props) => {
  const { t } = useTranslation()

  const hasKit = (offer.inventory_item_link?.length ?? 0) > 1
  const variantTitle = offer.product_variant?.title ?? ""

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-general-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading title={variantTitle}>{variantTitle}</Heading>
          {hasKit && (
            <span className="text-ui-fg-muted font-normal">
              <Component />
            </span>
          )}
        </div>
      </div>
      <SectionRow title={t("offers.fields.sku")} value={offer.sku ?? "-"} />
      <SectionRow title={t("offers.fields.ean")} value={offer.ean ?? "-"} />
      <SectionRow title={t("offers.fields.upc")} value={offer.upc ?? "-"} />
      <SectionRow
        title={t("shippingProfile.domain")}
        value={offer.shipping_profile?.name ?? "-"}
      />
      <SectionRow
        title={t("fields.createdAt")}
        value={formatDate(offer.created_at)}
      />
      <SectionRow
        title={t("fields.updatedAt")}
        value={formatDate(offer.updated_at)}
      />
    </Container>
  )
}
