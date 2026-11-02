import { SingleColumnPage, SingleColumnPageSkeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { useParams, type UIMatch } from "react-router-dom"

import { useMagentoWebhook } from "../../../../hooks/api/magento"
import { SettingsProviders } from "../../../../providers/settings-providers"
import { MagentoWebhookDetailBreadcrumb } from "./breadcrumb"
import { MagentoDeliveryListSection } from "./components/magento-delivery-list-section"
import { MagentoWebhookGeneralSection } from "./components/magento-webhook-general-section"

const MagentoWebhookDetailPage = () => {
  const { id } = useParams()

  const { webhook, isLoading, isError, error } = useMagentoWebhook(id!)

  if (isError) {
    throw error
  }

  if (isLoading || !webhook) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  return (
    <SingleColumnPage data={webhook} data-testid="magento-webhook-detail-page">
      <WidgetZone id="magento.detail.main">
        <MagentoWebhookGeneralSection webhook={webhook} />
        <MagentoDeliveryListSection webhookId={webhook.id} />
      </WidgetZone>
    </SingleColumnPage>
  )
}

const MagentoWebhookDetailRoute = () => (
  <SettingsProviders>
    <MagentoWebhookDetailPage />
  </SettingsProviders>
)

export const handle = {
  breadcrumb: (match: UIMatch) => <MagentoWebhookDetailBreadcrumb {...match} />,
  permissions: "integrations:view",
}

export default MagentoWebhookDetailRoute
