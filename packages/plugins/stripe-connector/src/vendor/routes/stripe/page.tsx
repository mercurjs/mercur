import { SingleColumnPage, SingleColumnPageSkeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { StripeIcon } from "../../components/stripe-icon"
import { useMyStripeAccount } from "../../hooks/api/stripe"
import { SettingsProviders } from "../../providers/settings-providers"
import { SetupForm } from "./components/setup-form"
import { SettlementsSection } from "./components/settlements-section"
import { StripeAccountSection } from "./components/stripe-account-section"

const StripeVendor = () => {
  const { payout_account, isPending, isError, error } = useMyStripeAccount()
  if (isError) throw error

  if (isPending) {
    return <SingleColumnPageSkeleton sections={2} />
  }

  if (!payout_account) {
    return <SetupForm />
  }

  return (
    <>
      <StripeAccountSection account={payout_account} />
      <SettlementsSection />
    </>
  )
}

const StripeVendorPage = () => (
  <SettingsProviders>
    <SingleColumnPage data-testid="vendor-stripe-page">
      <WidgetZone id="stripe.vendor">
        <StripeVendor />
      </WidgetZone>
    </SingleColumnPage>
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Stripe",
  icon: StripeIcon,
  group: "integrations",
  permissions: ["payouts:view"],
})

export const handle = { breadcrumb: () => "Stripe", permissions: "payouts:view" }

export default StripeVendorPage
