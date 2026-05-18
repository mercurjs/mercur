import { PencilSquare, Trash } from "@medusajs/icons"
import { ProductBrandDTO } from "@mercurjs/types"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteProductBrandAction } from "../../../common/hooks/use-delete-product-brand-action"

type ProductBrandRowActionsProps = {
  productBrand: ProductBrandDTO
}

export const ProductBrandRowActions = ({
  productBrand,
}: ProductBrandRowActionsProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteProductBrandAction(
    productBrand.id,
    productBrand.name
  )

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `/settings/product-brands/${productBrand.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              icon: <Trash />,
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`product-brand-list-table-action-menu-${productBrand.id}`}
    />
  )
}
