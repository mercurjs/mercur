import { CreditCard } from "@medusajs/icons"
import { SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { SettingsProviders } from "../../../providers/settings-providers"
import { SettlementListTable } from "./components/settlement-list-table"

const SettlementListPage = () => (
  <SettingsProviders>
    <SingleColumnPage data-testid="stripe-settlement-list-page">
      <WidgetZone id="stripe.settlements.list">
        <SettlementListTable />
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Stripe",
  icon: CreditCard,
  group: "finance",
  rank: 30,
  permissions: ["payouts:view"],
})

export const handle = {
  breadcrumb: () => "Stripe",
  permissions: "payouts:view",
}

export default SettlementListPage
