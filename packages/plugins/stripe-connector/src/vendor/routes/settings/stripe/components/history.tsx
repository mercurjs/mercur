import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useMyPayouts, useMySettlements, useMyTransfers } from "../../../../hooks/api/stripe"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, SETTLEMENT_STATUS_COLOR, SETTLEMENT_STATUS_LABEL, TRANSFER_STATUS_COLOR, TRANSFER_STATUS_LABEL, formatAmount, formatDate } from "../../../../lib/status"

const Section = ({ title, subtitle, children, empty }: { title: string; subtitle: string; children: React.ReactNode[]; empty: string }) => (
  <Container className="divide-y p-0">
    <div className="px-6 py-4">
      <Heading>{title}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {subtitle}
      </Text>
    </div>
    {children.length ? children : <SectionRow title={empty} value="-" />}
  </Container>
)

export const History = () => {
  const transfers = useMyTransfers({ limit: 10, offset: 0, type: ["order", "tax"] })
  const reversals = useMyTransfers({ limit: 10, offset: 0, type: "refund_reversal" })
  const settlements = useMySettlements({ limit: 10, offset: 0 })
  const payouts = useMyPayouts({ limit: 10, offset: 0 })

  return (
    <div className="flex flex-col gap-y-3">
      <Section title="Transfers" subtitle="Order totals minus commission, moved to your Stripe balance." empty="No transfers yet">
        {(transfers.data?.transfers ?? []).map((t) => (
          <SectionRow key={t.id} title={formatDate(t.created_at)} value={<span className="flex items-center gap-x-2"><span>{formatAmount(t.amount, t.currency_code)}</span><StatusBadge color={TRANSFER_STATUS_COLOR[t.status] ?? "grey"}>{TRANSFER_STATUS_LABEL[t.status] ?? t.status}</StatusBadge>{t.status_reason ? <span className="text-ui-fg-subtle">{t.status_reason}</span> : null}</span>} />
        ))}
      </Section>
      <Section title="Refunds" subtitle="Your share of each refund, reversed from the transfer." empty="No refunds yet">
        {(reversals.data?.transfers ?? []).map((t) => (
          <SectionRow key={t.id} title={formatDate(t.created_at)} value={<span className="flex items-center gap-x-2"><span>−{formatAmount(t.amount, t.currency_code)}</span><StatusBadge color={TRANSFER_STATUS_COLOR[t.status] ?? "grey"}>{TRANSFER_STATUS_LABEL[t.status] ?? t.status}</StatusBadge></span>} />
        ))}
      </Section>
      <Section title="Statements" subtitle="What you were owed per settlement window, and whether it was paid out." empty="No statements yet">
        {(settlements.data?.settlements ?? []).map((s) => (
          <SectionRow key={s.id} title={`${formatDate(s.period_start)} → ${formatDate(s.period_end)}`} value={<span className="flex items-center gap-x-2"><span>{formatAmount(s.amount, s.currency_code)}</span><StatusBadge color={SETTLEMENT_STATUS_COLOR[s.status] ?? "grey"}>{SETTLEMENT_STATUS_LABEL[s.status] ?? s.status}</StatusBadge></span>} />
        ))}
      </Section>
      <Section title="Payouts to your bank" subtitle="Each payout Stripe sent from your balance." empty="No payouts yet">
        {(payouts.data?.payouts ?? []).map((p) => (
          <SectionRow key={p.id} title={formatDate(p.created_at)} value={<span className="flex items-center gap-x-2"><span>{formatAmount(p.amount, p.currency_code)}</span><StatusBadge color={PAYOUT_STATUS_COLOR[p.status] ?? "grey"}>{PAYOUT_STATUS_LABEL[p.status] ?? p.status}</StatusBadge>{p.status_reason ? <span className="text-ui-fg-subtle">{p.status_reason}</span> : null}</span>} />
        ))}
      </Section>
    </div>
  )
}
