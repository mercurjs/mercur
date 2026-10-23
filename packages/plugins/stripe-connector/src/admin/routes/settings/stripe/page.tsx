import { CreditCard } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow, SingleColumnPage, WidgetZone } from "@mercurjs/dashboard-shared"
import { defineRouteConfig } from "@mercurjs/dashboard-sdk"

import { useStripeStatus } from "../../../hooks/api/stripe"
import { SettingsProviders } from "../../../providers/settings-providers"

const PAYOUT_EVENTS = ["account.updated", "transfer.created", "transfer.reversed", "payout.paid", "payout.failed", "payout.canceled"]
const PAYMENT_EVENTS = ["payment_intent.succeeded", "payment_intent.amount_capturable_updated", "payment_intent.payment_failed", "payment_intent.canceled", "charge.refunded"]

const StripeSettings = () => {
  const { data, isPending, isError, error } = useStripeStatus()
  if (isError) throw error

  const backend = import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000"
  const providers = data?.providers.filter((p) => p.id !== "pop_system_default") ?? []
  const options = (data?.options ?? {}) as Record<string, Record<string, unknown>>

  return (
    <SingleColumnPage data-testid="stripe-settings-page">
      <WidgetZone id="stripe.settings">
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <Heading>Stripe</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Webhook endpoints to register in the Stripe dashboard, and the payout module options in force.
              </Text>
            </div>
            {isPending ? <StatusBadge color="grey">Checking</StatusBadge> : providers.length ? <StatusBadge color="green">Connected</StatusBadge> : <StatusBadge color="orange">No payout provider</StatusBadge>}
          </div>
          <SectionRow title="Payout providers" value={providers.length ? providers.map((p) => p.id).join(", ") : "pop_system_default only"} />
          {providers.map((p) => (
            <SectionRow key={p.id} title={`Webhook for ${p.id}`} value={<code className="txt-compact-small select-all">{`${backend}/hooks/payout/${p.id}`}</code>} />
          ))}
          <SectionRow title="Connect webhook events" value={PAYOUT_EVENTS.join(", ")} />
          <SectionRow title="Payment webhook" value={<code className="txt-compact-small select-all">{`${backend}/hooks/payment/pp_stripe-connector_stripe`}</code>} />
          <SectionRow title="Payment webhook events" value={PAYMENT_EVENTS.join(", ")} />
        </Container>
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading>Module options</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Set in medusa-config.ts under the payout module.
            </Text>
          </div>
          {Object.entries(options).map(([group, values]) => (
            <SectionRow
              key={group}
              title={group}
              value={typeof values === "object" && values ? Object.entries(values).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ") : String(values)}
            />
          ))}
        </Container>
      </WidgetZone>
    </SingleColumnPage>
  )
}

const StripeSettingsPage = () => (
  <SettingsProviders>
    <StripeSettings />
  </SettingsProviders>
)

export const config = defineRouteConfig({
  label: "Stripe",
  icon: CreditCard,
  group: "finance",
  rank: 110,
  permissions: ["payouts:view"],
})

export const handle = { breadcrumb: () => "Stripe", permissions: "payouts:view" }

export default StripeSettingsPage
