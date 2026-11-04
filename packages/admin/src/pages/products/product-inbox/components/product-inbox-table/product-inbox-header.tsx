import { Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export const ProductInboxTitle = () => {
  const { t } = useTranslation()

  return (
    <div>
      <Heading data-testid="product-inbox-heading">
        {t("products.inbox.domain")}
      </Heading>
      <Text className="text-ui-fg-subtle" size="small">
        {t("products.inbox.subtitle")}
      </Text>
    </div>
  )
}

export const ProductInboxHeader = () => (
  <div className="flex items-center justify-between px-6 py-4">
    <ProductInboxTitle />
  </div>
)
