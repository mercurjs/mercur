import { TriangleRightMini } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import type { ProductVariantDTO } from "@medusajs/types"
import { Thumbnail } from "@components/common/thumbnail"

type InventoryItemVariantsSectionProps = {
  variants: ProductVariantDTO[]
}

export const InventoryItemVariantsSection = ({
  variants,
}: InventoryItemVariantsSectionProps) => {
  const { t } = useTranslation()

  if (!variants?.length) {
    return null
  }

  return (
    <Container className="p-0" data-testid="inventory-item-variants-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="inventory-item-variants-header">
        <Heading level="h2" data-testid="inventory-item-variants-title">{t("inventory.associatedVariants")}</Heading>
      </div>

      <div className="txt-small flex flex-col gap-2 px-2 pb-2" data-testid="inventory-item-variants-list">
        {variants.map((variant) => {
          const link = variant.product
            ? `/products/${variant.product.id}/variants/${variant.id}`
            : null

          const Inner = (
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors" data-testid={`inventory-item-variant-${variant.id}`}>
              <div className="flex items-center gap-3">
                <div className="shadow-elevation-card-rest rounded-md" data-testid={`inventory-item-variant-thumbnail-${variant.id}`}>
                  <Thumbnail src={variant.product?.thumbnail} />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-ui-fg-base font-medium" data-testid={`inventory-item-variant-title-${variant.id}`}>
                    {variant.title}
                  </span>
                  <span className="text-ui-fg-subtle" data-testid={`inventory-item-variant-options-${variant.id}`}>
                    {variant.options.map((o) => o.value).join(" ⋅ ")}
                  </span>
                </div>
                <div className="size-7 flex items-center justify-center" data-testid={`inventory-item-variant-arrow-${variant.id}`}>
                  <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
                </div>
              </div>
            </div>
          )

          if (!link) {
            return <div key={variant.id} data-testid={`inventory-item-variant-container-${variant.id}`}>{Inner}</div>
          }

          return (
            <Link
              to={link}
              key={variant.id}
              className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
              data-testid={`inventory-item-variant-link-${variant.id}`}
            >
              {Inner}
            </Link>
          )
        })}
      </div>
    </Container>
  )
}
