import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useMyPayouts, useMySettlements } from "../../../../hooks/api/stripe"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, SETTLEMENT_STATUS_COLOR, SETTLEMENT_STATUS_LABEL, formatAmount, formatDate } from "../../../../lib/status"

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
  const payouts = useMyPayouts({ limit: 10, offset: 0, order: "-created_at" })
  const settlements = useMySettlements({ limit: 10, offset: 0 })
  const reversals = (payouts.data?.payouts ?? []).flatMap((p) =>
    (p.reversals ?? []).map((r) => ({ ...r, currency_code: p.currency_code }))
  )

  return (
    <div className="flex flex-col gap-y-3">
      <Section title="Payouts" subtitle="Order totals minus commission, paid into your Stripe balance." empty="No payouts yet">
        {(payouts.data?.payouts ?? []).map((p) => (
          <SectionRow key={p.id} title={formatDate(p.created_at)} value={<span className="flex items-center gap-x-2"><span>{formatAmount(p.amount, p.currency_code)}</span><StatusBadge color={PAYOUT_STATUS_COLOR[p.status] ?? "grey"}>{PAYOUT_STATUS_LABEL[p.status] ?? p.status}</StatusBadge>{p.status_reason ? <span className="text-ui-fg-subtle">{p.status_reason}</span> : null}</span>} />
        ))}
      </Section>
      <Section title="Refunds" subtitle="Your share of each refund, taken back from the payout." empty="No refunds yet">
        {reversals.map((r) => (
          <SectionRow key={r.id} title={formatDate(r.created_at)} value={<span className="flex items-center gap-x-2"><span>−{formatAmount(r.amount, r.currency_code)}</span><StatusBadge color={PAYOUT_STATUS_COLOR[r.status] ?? "grey"}>{PAYOUT_STATUS_LABEL[r.status] ?? r.status}</StatusBadge></span>} />
        ))}
      </Section>
      <Section title="Statements" subtitle="What you were owed per settlement window, and the bank payout that paid it." empty="No statements yet">
        {(settlements.data?.settlements ?? []).map((s) => (
          <SectionRow key={s.id} title={`${formatDate(s.period_start)} → ${formatDate(s.period_end)}`} value={<span className="flex items-center gap-x-2"><span>{formatAmount(s.amount, s.currency_code)}</span><StatusBadge color={SETTLEMENT_STATUS_COLOR[s.status] ?? "grey"}>{SETTLEMENT_STATUS_LABEL[s.status] ?? s.status}</StatusBadge>{s.payout_status ? <StatusBadge color={PAYOUT_STATUS_COLOR[s.payout_status] ?? "grey"}>{`Bank ${PAYOUT_STATUS_LABEL[s.payout_status] ?? s.payout_status}`}</StatusBadge> : null}</span>} />
        ))}
      </Section>
    </div>
  )
}
