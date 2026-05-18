import { PencilSquare, Trash } from "@medusajs/icons"
import { ProductBrandDTO } from "@mercurjs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteProductBrandAction } from "../../../common/hooks/use-delete-product-brand-action"

type ProductBrandGeneralSectionProps = {
  productBrand: ProductBrandDTO
}

export const ProductBrandGeneralSection = ({
  productBrand,
}: ProductBrandGeneralSectionProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteProductBrandAction(
    productBrand.id,
    productBrand.name
  )

  return (
    <Container
      className="flex items-center justify-between"
      data-testid="product-brand-general-section-container"
    >
      <div>
        <Heading data-testid="product-brand-general-section-heading">
          {productBrand.name}
        </Heading>
        <Text
          size="small"
          className="text-ui-fg-subtle"
          data-testid="product-brand-general-section-handle"
        >
          /{productBrand.handle}
        </Text>
      </div>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                label: t("actions.edit"),
                icon: <PencilSquare />,
                to: "edit",
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
        data-testid="product-brand-general-section-action-menu"
      />
    </Container>
  )
}
