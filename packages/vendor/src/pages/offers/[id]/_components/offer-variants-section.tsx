import { Buildings, CurrencyDollar, TriangleRightMini } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { NoRecords } from "../../../../components/common/empty-table-content"

type OfferVariantOption = {
  value?: string | null
  option?: { title?: string | null } | null
}

export type OfferVariant = {
  id?: string | null
  title?: string | null
  sku?: string | null
  options?: OfferVariantOption[] | null
  offers?: Array<{ id: string; sku?: string | null }> | null
}

type VariantOfferRow = {
  key: string
  offerId: string
  variantTitle: string
  sku?: string | null
  options: OfferVariantOption[]
}

/**
 * Variants table of the product-shaped offer detail. One row per offer
 * (the "row = offer" model — a variant with multiple offers shows as
 * multiple rows), navigating to the offer-keyed variant detail
 * `variants/:offer_id` (Figma `40016500:747473`).
 */
export const OfferVariantsSection = ({
  variants,
}: {
  variants?: OfferVariant[] | null
}) => {
  const { t } = useTranslation()

  const rows: VariantOfferRow[] = (variants ?? []).flatMap((variant) =>
    (variant.offers ?? []).map((offer) => ({
      key: offer.id,
      offerId: offer.id,
      variantTitle: variant.title ?? "-",
      sku: offer.sku,
      options: variant.options ?? [],
    })),
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("offers.fields.variants")}</Heading>
        <div className="flex items-center gap-x-4">
          <Text size="small" className="text-ui-fg-subtle">
            {t("offers.fields.variantsCount", { count: rows.length })}
          </Text>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("offers.actions.edit_prices"),
                    icon: <CurrencyDollar />,
                    to: "edit-price",
                  },
                  {
                    label: t("offers.actions.edit_stock_levels"),
                    icon: <Buildings />,
                    to: "edit-stock",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <NoRecords
          className="h-60"
          title={t("offers.empty.heading")}
          message={t("offers.empty.description")}
        />
      ) : (
        rows.map((row) => (
          <Link
            key={row.key}
            to={`variants/${row.offerId}`}
            className="bg-ui-bg-base hover:bg-ui-bg-base-hover transition-fg grid grid-cols-[1fr_1fr_1fr_28px] items-center gap-4 px-6 py-4"
            data-testid={`offer-variant-row-${row.offerId}`}
          >
            <Text size="small" leading="compact" weight="plus" className="truncate">
              {row.variantTitle}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle truncate">
              {row.sku || "-"}
            </Text>
            <div className="flex flex-wrap gap-1">
              {row.options.length > 0 ? (
                row.options.map((opt, i) => (
                  <Badge key={i} size="2xsmall">
                    {opt.value}
                  </Badge>
                ))
              ) : (
                <Text size="small" className="text-ui-fg-muted">
                  -
                </Text>
              )}
            </div>
            <TriangleRightMini className="text-ui-fg-muted" />
          </Link>
        ))
      )}
    </Container>
  )
}
