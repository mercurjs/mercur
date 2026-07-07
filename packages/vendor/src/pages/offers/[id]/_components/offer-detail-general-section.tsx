import { Trash } from "@medusajs/icons"
import { Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { productStatusColor } from "../../../products/[id]/_components/product-general-section"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"
import { OfferProduct } from "../../common/types"

/**
 * Details section of the product-shaped offer detail. Shows the
 * product's own fields (Description / Subtitle / Handle / Discountable)
 * with a Delete-only kebab that removes the seller's offers on this
 * product (Figma `40016489:640874`).
 */
const GENERAL_FIELD_IDS = [
  "title",
  "status",
  "description",
  "subtitle",
  "handle",
  "discountable",
]

export const OfferDetailGeneralSection = ({
  product,
}: {
  product: OfferProduct
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()

  const offerIds = (product.variants ?? []).flatMap((v) =>
    (v.offers ?? []).map((o) => o.id),
  )

  const handleDelete = async () => {
    if (!offerIds.length) {
      return
    }

    const confirmed = await prompt({
      title: t("general.areYouSure"),
      // The product listing is one offer to the seller, regardless of how
      // many of its variants are offered under the hood.
      description: t("offers.bulkDelete.description", { count: 1 }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })

    if (!confirmed) {
      return
    }

    const result = await bulkDelete(offerIds)

    if (result.failed.length === 0) {
      toast.success(t("offers.bulkDelete.successToast", { count: 1 }))
      navigate("/offers")
    } else {
      toast.warning(
        t("offers.bulkDelete.partialToast", {
          succeeded: result.succeeded.length,
          total: offerIds.length,
          failed: result.failed.length,
        }),
      )
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="offer" zone="general" id="title" data={product}>
          <Heading>{product.title}</Heading>
        </DisplayField>
        <div className="flex items-center gap-x-4">
          {product.status && (
            <DisplayField
              model="offer"
              zone="general"
              id="status"
              data={product}
            >
              <StatusBadge color={productStatusColor(product.status)}>
                {t(`products.productStatus.${product.status}`)}
              </StatusBadge>
            </DisplayField>
          )}
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                    disabled: offerIds.length === 0,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <DisplayField model="offer" zone="general" id="description" data={product}>
        <SectionRow
          title={t("fields.description")}
          value={product.description || "-"}
        />
      </DisplayField>
      <DisplayField model="offer" zone="general" id="subtitle" data={product}>
        <SectionRow
          title={t("fields.subtitle")}
          value={product.subtitle || "-"}
        />
      </DisplayField>
      <DisplayField model="offer" zone="general" id="handle" data={product}>
        <SectionRow
          title={t("fields.handle")}
          value={product.handle ? `/${product.handle}` : "-"}
        />
      </DisplayField>
      <DisplayField
        model="offer"
        zone="general"
        id="discountable"
        data={product}
      >
        <SectionRow
          title={t("fields.discountable")}
          value={product.discountable ? t("general.true") : t("general.false")}
        />
      </DisplayField>
      <DisplayExtensionZone
        model="offer"
        zone="general"
        data={product}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  )
}
