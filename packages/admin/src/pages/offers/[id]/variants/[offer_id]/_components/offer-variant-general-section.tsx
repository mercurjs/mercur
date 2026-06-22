import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ProductVariantDTO } from "@mercurjs/types"

import { SectionRow } from "../../../../../../components/common/section"

export type OfferVariantData = {
  id: string
  sku?: string | null
  product_variant?: ProductVariantDTO | null
}

/**
 * General section of the read-only admin Offer Variant detail (SPEC-010):
 * variant title heading + "Offer Variant" sub-label, then SKU and one row
 * per product option. Admin is read-only, so there is **no Edit Details
 * kebab**.
 */
export const OfferVariantGeneralSection = ({
  offer,
}: {
  offer: OfferVariantData
}) => {
  const { t } = useTranslation()

  const variant = offer.product_variant
  const options = variant?.options ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-start justify-between px-6 py-4">
        <div className="flex flex-col">
          <Heading>{variant?.title ?? "-"}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.detail.offerVariant")}
          </Text>
        </div>
      </div>

      <SectionRow title={t("offers.fields.sku")} value={offer.sku ?? "-"} />

      {options.map((opt) => (
        <SectionRow
          key={opt.id ?? opt.option?.id ?? opt.value ?? ""}
          title={opt.option?.title ?? "-"}
          value={opt.value ? <Badge size="2xsmall">{opt.value}</Badge> : "-"}
        />
      ))}
    </Container>
  )
}
