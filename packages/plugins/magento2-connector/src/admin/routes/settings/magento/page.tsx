import { ShoppingBag } from "@medusajs/icons"
import { SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { Children, type ReactNode } from "react"

import { SettingsProviders } from "../../../providers/settings-providers"
import { MagentoStatusSection } from "./components/magento-status-section"
import { MagentoWebhookTable } from "./components/magento-webhook-table"

const MagentoPage = ({ children }: { children?: ReactNode }) => (
  <SettingsProviders>
    <SingleColumnPage hasOutlet data-testid="magento-page">
      <WidgetZone id="magento.list">
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <MagentoStatusSection />
            <MagentoWebhookTable />
          </>
        )}
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Magento",
  icon: ShoppingBag,
  rank: 60,
  group: "developer",
  permissions: ["integrations:view"],
})

export const handle = {
  breadcrumb: () => <span>Magento</span>,
  permissions: "integrations:view",
}

export default MagentoPage
