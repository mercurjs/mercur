import { PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { useDeleteOfferAction } from "../../common/hooks/use-delete-offer-action"
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
  const handleDelete = useDeleteOfferAction({
    id: offer.id,
    sku: offer.sku ?? "",
    redirectOnSuccess: true,
  })

  const variant = offer.product_variant
  const variantHref = variant?.product_id
    ? `/products/${variant.product_id}#variant-${variant.id ?? ""}`
    : null

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-general-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("fields.details")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit",
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
      <SectionRow title={t("offers.fields.sku")} value={offer.sku ?? "-"} />
      <SectionRow
        title={t("offers.fields.variant")}
        value={
          variantHref ? (
            <Link
              to={variantHref}
              className="text-ui-fg-interactive hover:underline"
            >
              {variant?.product?.title ?? variant?.title ?? variant?.id}
            </Link>
          ) : (
            (variant?.product?.title ?? variant?.title ?? "-")
          )
        }
      />
      <SectionRow title={t("offers.fields.ean")} value={offer.ean ?? "-"} />
      <SectionRow title={t("offers.fields.upc")} value={offer.upc ?? "-"} />
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
