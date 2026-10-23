import { CreditCard } from "@medusajs/icons"
import { Container } from "@medusajs/ui"
import { SingleColumnPage, Skeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { useMyStripeAccount } from "../../../hooks/api/stripe"
import { SettingsProviders } from "../../../providers/settings-providers"
import { History } from "./components/history"
import { SetupForm } from "./components/setup-form"
import { StatusCard } from "./components/status-card"

const StripeVendor = () => {
  const { data, isPending, isError, error } = useMyStripeAccount()
  if (isError) throw error

  return (
    <SingleColumnPage data-testid="vendor-stripe-page">
      <WidgetZone id="stripe.vendor">
        {isPending ? (
          <Container className="p-6">
            <Skeleton className="h-7 w-48" />
          </Container>
        ) : data?.payout_account ? (
          <>
            <StatusCard account={data.payout_account} />
            <History />
          </>
        ) : (
          <SetupForm />
        )}
      </WidgetZone>
    </SingleColumnPage>
  )
}

const StripeVendorPage = () => (
  <SettingsProviders>
    <StripeVendor />
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Stripe",
  icon: CreditCard,
  rank: 40,
  permissions: ["payouts:view"],
})

export const handle = { breadcrumb: () => "Stripe", permissions: "payouts:view" }

export default StripeVendorPage
