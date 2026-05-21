import { Component, PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

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

  const hasKit = (offer.inventory_item_link?.length ?? 0) > 1
  const productTitle = offer.product_variant?.product?.title ?? ""

  return (
    <Container
      className="divide-y p-0"
      data-testid="offer-detail-general-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Heading>{offer.sku ?? "-"}</Heading>
            {hasKit && (
              <span className="text-ui-fg-muted font-normal">
                <Component />
              </span>
            )}
          </div>
          <span className="text-ui-fg-subtle txt-small mt-2 block">
            {productTitle || t("offers.detail.offerLabel")}
          </span>
        </div>
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
      <SectionRow title={t("offers.fields.ean")} value={offer.ean ?? "-"} />
      <SectionRow title={t("offers.fields.upc")} value={offer.upc ?? "-"} />
      <SectionRow
        title={t("offers.fields.shippingProfile")}
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
