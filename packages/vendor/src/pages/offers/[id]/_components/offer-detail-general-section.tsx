import { Trash } from "@medusajs/icons"
import { Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { useBulkDeleteOffers } from "../../../../hooks/api/offers"

const statusColor = (status?: string | null) => {
  switch (status) {
    case "draft":
      return "grey"
    case "proposed":
      return "orange"
    case "published":
      return "green"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

export type OfferDetailProduct = {
  id: string
  title?: string | null
  subtitle?: string | null
  description?: string | null
  handle?: string | null
  discountable?: boolean | null
  status?: string | null
  variants?: Array<{ offers?: Array<{ id: string }> | null }> | null
}

/**
 * Details section of the product-shaped offer detail. Shows the
 * product's own fields (Description / Subtitle / Handle / Discountable)
 * with a Delete-only kebab that removes the seller's offers on this
 * product (Figma `40016489:640874`).
 */
export const OfferDetailGeneralSection = ({
  product,
}: {
  product: OfferDetailProduct
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
      description: t("offers.bulkDelete.description", { count: offerIds.length }),
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
        <Heading>{product.title}</Heading>
        <div className="flex items-center gap-x-4">
          {product.status && (
            <StatusBadge color={statusColor(product.status)}>
              {t(`products.productStatus.${product.status}`)}
            </StatusBadge>
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

      <SectionRow
        title={t("fields.description")}
        value={product.description || "-"}
      />
      <SectionRow title={t("fields.subtitle")} value={product.subtitle || "-"} />
      <SectionRow
        title={t("fields.handle")}
        value={product.handle ? `/${product.handle}` : "-"}
      />
      <SectionRow
        title={t("fields.discountable")}
        value={product.discountable ? t("general.true") : t("general.false")}
      />
    </Container>
  )
}
