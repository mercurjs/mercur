import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { getFormattedCountry } from "../../../../../lib/addresses"
import { useExtension } from "../../../../../providers/extension-provider"

type ProductAttributeSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductAttributeSection = ({
  product,
}: ProductAttributeSectionProps) => {
  const { t } = useTranslation()
  const { getDisplays } = useExtension()

  return (
    <Container className="divide-y p-0" data-testid="product-attribute-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="product-attribute-header">
        <Heading level="h2" data-testid="product-attribute-title">{t("products.attributes")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "attributes",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="product-attribute-action-menu"
        />
      </div>
      <SectionRow title={t("fields.height")} value={product.height} data-testid="product-height-row" />
      <SectionRow title={t("fields.width")} value={product.width} data-testid="product-width-row" />
      <SectionRow title={t("fields.length")} value={product.length} data-testid="product-length-row" />
      <SectionRow title={t("fields.weight")} value={product.weight} data-testid="product-weight-row" />
      <SectionRow title={t("fields.midCode")} value={product.mid_code} data-testid="product-mid-code-row" />
      <SectionRow title={t("fields.hsCode")} value={product.hs_code} data-testid="product-hs-code-row" />
      <SectionRow
        title={t("fields.countryOfOrigin")}
        value={getFormattedCountry(product.origin_country)}
        data-testid="product-country-of-origin-row"
      />
      {getDisplays("product", "attributes").map((Component, i) => {
        return <Component key={i} data={product} />
      })}
    </Container>
  )
}
