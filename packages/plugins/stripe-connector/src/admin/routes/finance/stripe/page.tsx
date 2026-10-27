import { CreditCard } from "@medusajs/icons"
import { Tabs } from "@medusajs/ui"
import { SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"
import { useEffect, useState } from "react"

import { SettingsProviders } from "../../../providers/settings-providers"
import { AccountsTab } from "./components/accounts-tab"
import { AlertsTab } from "./components/alerts-tab"
import { CapturesTab } from "./components/captures-tab"
import { KycTab } from "./components/kyc-tab"
import { SettlementsTab } from "./components/settlements-tab"
import { StatusStrip } from "./components/status-strip"
import { PayoutsTab } from "./components/payouts-tab"

const TABS = [
  { id: "onboarding", label: "Onboarding", render: () => <AccountsTab /> },
  { id: "captures", label: "Captures", render: () => <CapturesTab /> },
  { id: "payouts", label: "Payouts", render: () => <PayoutsTab /> },
  { id: "settlements", label: "Settlements", render: () => <SettlementsTab /> },
  { id: "alerts", label: "Alerts", render: () => <AlertsTab /> },
  { id: "kyc", label: "KYC", render: () => <KycTab /> },
]

const StripePage = () => {
  const [tab, setTab] = useState(() => (window.location.hash || "#onboarding").slice(1))

  useEffect(() => {
    window.location.hash = tab
  }, [tab])

  return (
    <SettingsProviders>
      <SingleColumnPage hasOutlet data-testid="stripe-page">
        <WidgetZone id="stripe.operations">
          <StatusStrip onJump={setTab} />
          <Tabs value={tab} onValueChange={setTab}>
            <Tabs.List>
              {TABS.map((t) => (
                <Tabs.Trigger key={t.id} value={t.id} data-testid={`stripe-tab-${t.id}`}>
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {TABS.map((t) => (
              <Tabs.Content key={t.id} value={t.id} className="mt-3">
                {tab === t.id ? t.render() : null}
              </Tabs.Content>
            ))}
          </Tabs>
        </WidgetZone>
      </SingleColumnPage>
    </SettingsProviders>
  )
}

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

export default StripePage
