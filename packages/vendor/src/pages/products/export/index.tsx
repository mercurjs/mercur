// Route: /products/export
import { Heading, Text } from "@medusajs/ui"
import { RouteDrawer } from "@components/modals"
import { useTranslation } from "react-i18next"

export const Component = () => {
  const { t } = useTranslation()

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("products.export.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("products.export.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Body className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {t("general.comingSoon", "This feature is not available yet.")}
        </Text>
      </RouteDrawer.Body>
    </RouteDrawer>
  )
}
