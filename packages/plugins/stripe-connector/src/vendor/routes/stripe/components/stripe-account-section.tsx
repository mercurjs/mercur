import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import type { VendorAccount } from "../../../lib/client"
import { humanizeRequirement, stripeRequirementsOf } from "../../../lib/status"

const Requirements = ({ items }: { items: string[] }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item} size="2xsmall" title={item}>
          {humanizeRequirement(item)}
        </Badge>
      ))}
    </div>
  ) : (
    "-"
  )

export const StripeAccountSection = ({ account }: { account: VendorAccount }) => {
  const requirements = stripeRequirementsOf(account.data)

  return (
    <Container className="divide-y p-0" data-testid="stripe-account-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="stripe-account-heading">
            Stripe account
          </Heading>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            The connected account your payouts land on, and what Stripe still needs from you.
          </Text>
        </div>
      </div>
      <SectionRow title="Card payments" value={account.charges_enabled ? "Enabled" : "Not enabled yet"} />
      <SectionRow title="Currently due" value={<Requirements items={requirements.currently_due} />} />
      <SectionRow title="Past due" value={<Requirements items={requirements.past_due} />} />
      <SectionRow title="Pending verification" value={<Requirements items={requirements.pending_verification} />} />
    </Container>
  )
}
