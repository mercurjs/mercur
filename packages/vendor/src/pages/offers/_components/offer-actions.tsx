import { Buildings, CurrencyDollar, Trash } from "@medusajs/icons"
import { toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../components/common/action-menu"
import { useBulkDeleteOffers } from "../../../hooks/api/offers"

type OfferProductActions = {
  id: string
  title: string
  /** Ids of the seller's offers across this product's variants. */
  offerIds: string[]
}

/**
 * Row kebab for the product-backed Offers list, matching Figma
 * `40016482:529681`: Edit prices / Edit stock levels / Delete. Edit
 * prices & Edit stock levels open the bulk DataGrid modals scoped to the
 * product's offered variants; Delete removes the seller's offers on the
 * product (bulk-deletes every offer collected from the row).
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

    const result = await bulkDelete(product.offerIds)

    if (result.failed.length === 0) {
      toast.success(t("offers.bulkDelete.successToast", { count: 1 }))
    } else {
      toast.warning(
        t("offers.bulkDelete.partialToast", {
          succeeded: result.succeeded.length,
          total: product.offerIds.length,
          failed: result.failed.length,
        }),
      )
    }
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <CurrencyDollar />,
              label: t("offers.actions.edit_prices"),
              to: `${product.id}/edit-price`,
            },
            {
              icon: <Buildings />,
              label: t("offers.actions.edit_stock_levels"),
              to: `${product.id}/edit-stock`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
              disabled: product.offerIds.length === 0,
            },
          ],
        },
      ]}
    />
  )
}
