import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const ProductRequestsTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="product-requests-heading">
        {t("products.requests.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("products.requests.subtitle")}
      </Text>
    </div>
  )
}

export const ProductRequestsHeader = () => (
  <div className="flex items-center justify-between px-6 py-4">
    <ProductRequestsTitle />
  </div>
)
