import { PencilSquare } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../../components/common/section"

export type OfferVariantData = {
  id: string
  sku?: string | null
  product_variant?: {
    title?: string | null
    options?: Array<{
      id?: string | null
      value?: string | null
      option?: { id?: string | null; title?: string | null } | null
    }> | null
    product?: { thumbnail?: string | null } | null
  } | null
}

/**
 * General section of the Offer Variant detail (Figma `40016491:703365`):
 * variant title heading + "Offer Variant" sub-label + Edit Details kebab
 * (SKU only — no manage-inventory / allow-backorders toggles), then SKU
 * and one row per product option.
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
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "edit",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>

      <SectionRow title={t("offers.fields.sku")} value={offer.sku ?? "-"} />

      {options.map((opt) => (
        <SectionRow
          key={opt.id ?? opt.option?.id ?? opt.value ?? ""}
          title={opt.option?.title ?? "-"}
          value={
            opt.value ? (
              <Badge size="2xsmall">{opt.value}</Badge>
            ) : (
              "-"
            )
          }
        />
      ))}
    </Container>
  )
}
