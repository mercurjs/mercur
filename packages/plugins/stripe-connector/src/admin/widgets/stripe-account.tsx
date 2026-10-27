import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow, Skeleton } from "@mercurjs/dashboard-shared"

import { useStripeAccounts, useStripePayouts, useStripeSettlements } from "../hooks/api/stripe"
import { SettingsProviders } from "../providers/settings-providers"
import { isIgnored, type PayoutAccountRow } from "../lib/client"
import { ACCOUNT_STATUS_COLOR, KYC_STATUS_COLOR, KYC_STATUS_LABEL, formatAmount, formatDate } from "../lib/status"

const Body = ({ sellerId }: { sellerId: string }) => {
  const accounts = useStripeAccounts({ limit: 1, offset: 0, seller_id: sellerId })
  const account = accounts.data?.payout_accounts?.[0] as PayoutAccountRow | undefined
  const payouts = useStripePayouts({ limit: 5, offset: 0, account_id: account?.id ?? "none", order: "-created_at" }, { enabled: !!account })
  const settlements = useStripeSettlements({ limit: 5, offset: 0, account_id: account?.id ?? "none" }, { enabled: !!account })

  if (accounts.isPending) {
    return (
      <Container className="p-0">
        <Skeleton className="h-7 w-48" />
      </Container>
    )
  }

  if (!account) {
    return (
      <Container className="p-0 px-6 py-4">
        <Heading>Stripe</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          No connected account yet. The onboarding job creates one within a minute of the seller registering.
        </Text>
      </Container>
    )
  }

  const url = (account.onboarding?.data?.url as string | undefined) ?? null

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0" data-testid="stripe-seller-account">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Stripe account</Heading>
          <StatusBadge color={ACCOUNT_STATUS_COLOR[account.status] ?? "grey"}>{account.status}</StatusBadge>
        </div>
        <SectionRow title="Account id" value={account.provider_account_id ?? "-"} />
        <SectionRow title="KYC" value={account.kyc_status ? <StatusBadge color={KYC_STATUS_COLOR[account.kyc_status] ?? "grey"}>{KYC_STATUS_LABEL[account.kyc_status]}</StatusBadge> : "-"} />
        <SectionRow title="Payouts enabled" value={account.payouts_enabled ? "Yes" : "No"} />
        <SectionRow title="Charges enabled" value={account.charges_enabled ? "Yes" : "No"} />
        <SectionRow title="Disabled reason" value={account.disabled_reason ?? "-"} />
        <SectionRow title="Ignored" value={isIgnored(account) ? "Yes" : "No"} />
        <SectionRow title="Current link" value={url ? <a href={url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive">{String(account.onboarding?.data?.kind ?? "link")}</a> : "-"} />
        <SectionRow title="Last synced" value={formatDate(account.last_synced_at)} />
      </Container>
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Latest payouts</Heading>
        </div>
        {(payouts.data?.payouts ?? []).map((p) => (
          <SectionRow key={p.id} title={formatDate(p.created_at)} value={`${formatAmount(p.amount, p.currency_code)} · ${p.status}${p.status_reason ? ` · ${p.status_reason}` : ""}`} />
        ))}
        {!payouts.data?.payouts?.length ? <SectionRow title="No payouts" value="-" /> : null}
      </Container>
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Latest settlements</Heading>
        </div>
        {(settlements.data?.settlements ?? []).map((s) => (
          <SectionRow key={s.id} title={formatDate(s.period_end)} value={`${formatAmount(s.amount, s.currency_code)} · ${s.status}${s.payout_status ? ` · bank payout ${s.payout_status}` : ""}`} />
        ))}
        {!settlements.data?.settlements?.length ? <SectionRow title="No settlements" value="-" /> : null}
      </Container>
    </div>
  )
}

const StripeAccountWidget = ({ data }: DetailWidgetProps<{ id?: string }>) => {
  const sellerId = data?.id ?? ""
  if (!sellerId) return null
  return (
    <SettingsProviders>
      <Body sellerId={sellerId} />
    </SettingsProviders>
  )
}

export const config = defineWidgetConfig({
  zone: "stores.detail.side",
  id: "stripe-account",
  permission: "payouts:view",
})

export default StripeAccountWidget
