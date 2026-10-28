import { Container } from "@medusajs/ui"
import { SingleColumnPage, Skeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { StripeIcon } from "../../components/stripe-icon"
import { useMyStripeAccount } from "../../hooks/api/stripe"
import { SettingsProviders } from "../../providers/settings-providers"
import { SetupForm } from "./components/setup-form"
import { StatementsSection } from "./components/statements-section"
import { StripeAccountSection } from "./components/stripe-account-section"

const StripeVendor = () => {
  const { data, isPending, isError, error } = useMyStripeAccount()
  if (isError) throw error

  if (isPending) {
    return (
      <Container className="p-6">
        <Skeleton className="h-7 w-48" />
      </Container>
    )
  }

  if (!data?.payout_account) {
    return <SetupForm />
  }

  return (
    <>
      <StripeAccountSection account={data.payout_account} />
      <StatementsSection />
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
