import { BuildingStorefront, Trash } from "@medusajs/icons"
import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../components/common/action-menu"
import { useBulkDeleteOffers } from "../../../hooks/api/offers"

type OfferProductActions = {
  id: string
  /** Every offer id across this product's variants (all sellers). */
  offerIds: string[]
  /** The single store when the product is offered by exactly one seller. */
  sellerId: string | null
}

/**
 * Row kebab for the product-backed admin Offers list (SPEC-010).
 * Admin is read-only, so there is no Edit; the operator can **Open store**
 * (only when a single store offers the product) and **Delete** the
 * product's offers. Delete removes every offer collected from the row via
 * the existing per-offer DELETE fan-out (`useBulkDeleteOffers`).
 */
export const OfferActions = ({ product }: { product: OfferProductActions }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: bulkDelete } = useBulkDeleteOffers()

  const handleDelete = async () => {
    if (!product.offerIds.length) {
      return
    }

    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("offers.bulkDelete.description", {
        count: product.offerIds.length,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "danger",
    })

    if (!confirmed) {
      return
    }

    const result = await bulkDelete(product.offerIds)

    if (result.failed.length === 0) {
      toast.success(
        t("offers.bulkDelete.successToast", { count: result.succeeded.length }),
      )
    } else {
      toast.warning(
        t("offers.bulkDelete.errorToast", {
          message: `${result.succeeded.length}/${product.offerIds.length} succeeded`,
        }),
      )
    }
  }

  const groups = []

  if (product.sellerId) {
    groups.push({
      actions: [
        {
          icon: <BuildingStorefront />,
          label: t("offers.actions.openStore"),
          to: `/stores/${product.sellerId}`,
        },
      ],
    })
  }

  groups.push({
    actions: [
      {
        icon: <Trash />,
        label: t("actions.delete"),
        onClick: handleDelete,
        disabled: product.offerIds.length === 0,
      },
    ],
  })

  return <ActionMenu groups={groups} />
}
