import { Trash } from "@medusajs/icons"
import { Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"
import { OfferProduct } from "../../common/types"

const GENERAL_FIELD_IDS = [
  "title",
  "status",
  "description",
  "subtitle",
  "handle",
  "discountable",
]

/** Status → badge color, mirroring the admin product detail general section. */
const productStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "green"
    case "rejected":
      return "red"
    case "proposed":
      return "orange"
    default:
      return "grey"
  }
}

/**
 * Details section of the product-shaped admin offer detail (SPEC-010).
 * Shows the product's own fields (Description / Subtitle / Handle /
 * Discountable). Admin is read-only except delete — the kebab carries a
 * single Delete that removes every store's offers on this product.
 */
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
      description: t("offers.bulkDelete.description", {
        count: offerIds.length,
        storeName: t("offers.fields.store"),
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })

    if (!confirmed) {
      return
    }

    const result = await bulkDelete(offerIds)

    if (result.failed.length === 0) {
      toast.success(
        t("offers.bulkDelete.successToast", { count: result.succeeded.length }),
      )
      navigate("/offers")
    } else {
      toast.warning(
        t("offers.bulkDelete.errorToast", {
          message: `${result.succeeded.length}/${offerIds.length} succeeded`,
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
      <DisplayField model="offer" zone="general" id="discountable" data={product}>
        <SectionRow
          title={t("fields.discountable")}
          value={product.discountable ? t("fields.true") : t("fields.false")}
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
