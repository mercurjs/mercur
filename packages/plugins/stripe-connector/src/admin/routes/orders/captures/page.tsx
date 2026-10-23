import { CreditCard } from "@medusajs/icons"
import { SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { SettingsProviders } from "../../../providers/settings-providers"
import { CapturesTab } from "../../finance/stripe/components/captures-tab"

const CapturesPage = () => (
  <SettingsProviders>
    <SingleColumnPage data-testid="stripe-captures-page">
      <WidgetZone id="orders.captures">
        <CapturesTab />
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Captures",
  icon: CreditCard,
  group: "orders",
  rank: 20,
  permissions: ["payouts:view"],
})

export const handle = {
  breadcrumb: () => "Captures",
  permissions: "payouts:view",
}

export default CapturesPage
