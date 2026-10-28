import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Eye, EyeSlash, OpenRectArrowOut } from "@medusajs/icons"
import { Badge, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { ActionMenu, SectionRow } from "@mercurjs/dashboard-shared"

import { useIgnoreStripeAccount, useStripeAccount } from "../hooks/api/stripe"
import { isIgnored, type PayoutAccountRow } from "../lib/client"
import { disabledReasonLabel, humanizeRequirement, stripeRequirementsOf } from "../lib/status"
import { SettingsProviders } from "../providers/settings-providers"

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

const StripeAccountSection = ({ account }: { account: PayoutAccountRow }) => {
  const ignore = useIgnoreStripeAccount(account.id)

  const ignored = isIgnored(account)
  const requirements = stripeRequirementsOf(account.data)

  const notify = (message: string) => ({
    onSuccess: () => toast.success(message),
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <Container className="divide-y p-0" data-testid="stripe-payout-account-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2" data-testid="stripe-payout-account-heading">
            Stripe
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Connected account and what Stripe still needs from the store.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          {ignored ? <StatusBadge color="grey">Ignored</StatusBadge> : null}
          <ActionMenu
            groups={[
              {
                actions: account.external_id
                  ? [
                      {
                        label: "Open in Stripe",
                        icon: <OpenRectArrowOut />,
                        onClick: () =>
                          window.open(`https://dashboard.stripe.com/connect/accounts/${account.external_id}`, "_blank"),
                      },
                    ]
                  : [],
              },
              {
                actions: [
                  {
                    label: ignored ? "Stop ignoring" : "Ignore store",
                    icon: ignored ? <Eye /> : <EyeSlash />,
                    onClick: () =>
                      ignore.mutate(!ignored, notify(ignored ? "Store is no longer ignored" : "Store ignored")),
                    permission: "payouts:edit",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow title="Account ID" value={account.external_id ?? "-"} />
      <SectionRow
        title="Stripe reason"
        value={account.disabled_reason ? disabledReasonLabel(account.disabled_reason) : "-"}
      />
      <SectionRow title="Currently due" value={<Requirements items={requirements.currently_due} />} />
      <SectionRow title="Past due" value={<Requirements items={requirements.past_due} />} />
      <SectionRow title="Pending verification" value={<Requirements items={requirements.pending_verification} />} />
    </Container>
  )
}

const Body = ({ id }: { id: string }) => {
  const { payout_account } = useStripeAccount(id)

  if (!payout_account) {
    return null
  }

  return <StripeAccountSection account={payout_account as PayoutAccountRow} />
}

const StripePayoutAccountWidget = ({ data }: DetailWidgetProps<{ id?: string }>) => {
  if (!data?.id) {
    return null
  }

  return (
    <SettingsProviders>
      <Body id={data.id} />
    </SettingsProviders>
  )
}

export const config = defineWidgetConfig({
  zone: "payout_accounts.detail.side",
  id: "stripe-payout-account",
  permission: "payouts:view",
})

export default StripePayoutAccountWidget
