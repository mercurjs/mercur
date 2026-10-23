import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { SectionRow, SingleColumnPage } from "@mercurjs/dashboard-shared"
import { useParams } from "react-router-dom"

import { useStripeSettlement } from "../../../../../hooks/api/stripe"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, SETTLEMENT_STATUS_COLOR, SETTLEMENT_STATUS_LABEL, TRANSFER_STATUS_COLOR, TRANSFER_STATUS_LABEL, formatAmount, formatDate } from "../../../../../lib/status"
import { SettingsProviders } from "../../../../../providers/settings-providers"

const Lines = ({ title, lines, currency }: { title: string; lines: { id: string; amount: unknown; status: string; order_display_id?: number | null; provider_transfer_id?: string | null; reason?: string | null }[]; currency: string }) => (
  <Container className="divide-y p-0">
    <div className="px-6 py-4">
      <Heading>{title}</Heading>
    </div>
    {lines.length ? (
      lines.map((line) => (
        <SectionRow
          key={line.id}
          title={line.order_display_id ? `Order #${line.order_display_id}` : line.reason ?? line.id}
          value={
            <span className="flex items-center gap-x-2">
              <span>{formatAmount(line.amount, currency)}</span>
              <StatusBadge color={TRANSFER_STATUS_COLOR[line.status] ?? "grey"}>{TRANSFER_STATUS_LABEL[line.status] ?? line.status}</StatusBadge>
              {line.provider_transfer_id ? <span className="text-ui-fg-subtle">{line.provider_transfer_id}</span> : null}
            </span>
          }
        />
      ))
    ) : (
      <SectionRow title="None" value="-" />
    )}
  </Container>
)

const SettlementDetail = () => {
  const { id = "" } = useParams()
  const { data, isPending, isError, error } = useStripeSettlement(id)
  if (isError) throw error
  const s = data?.settlement

  return (
    <SingleColumnPage data-testid="stripe-settlement-page">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Settlement {s?.seller?.name ?? ""}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {s ? `${formatDate(s.period_start)} → ${formatDate(s.period_end)}` : isPending ? "Loading" : ""}
            </Text>
          </div>
          {s ? <StatusBadge color={SETTLEMENT_STATUS_COLOR[s.status] ?? "grey"}>{SETTLEMENT_STATUS_LABEL[s.status] ?? s.status}</StatusBadge> : null}
        </div>
        {s ? (
          <>
            <SectionRow title="Transfers" value={formatAmount(s.transfers_total, s.currency_code)} />
            <SectionRow title="Reversals" value={`−${formatAmount(s.reversals_total, s.currency_code)}`} />
            <SectionRow title="Adjustments" value={formatAmount(s.adjustments_total, s.currency_code)} />
            <SectionRow title="Amount" value={formatAmount(s.amount, s.currency_code)} />
            <SectionRow
              title="Payout"
              value={
                s.payout ? (
                  <span className="flex items-center gap-x-2">
                    <StatusBadge color={PAYOUT_STATUS_COLOR[s.payout.status] ?? "grey"}>{PAYOUT_STATUS_LABEL[s.payout.status] ?? s.payout.status}</StatusBadge>
                    <span className="text-ui-fg-subtle">{s.payout.provider_payout_id ?? s.payout.status_reason ?? ""}</span>
                  </span>
                ) : (
                  "None"
                )
              }
            />
          </>
        ) : null}
      </Container>
      {s ? (
        <>
          <Lines title="Transfers" lines={s.transfers} currency={s.currency_code} />
          <Lines title="Reversals" lines={s.reversals} currency={s.currency_code} />
          <Lines title="Adjustments" lines={s.adjustments.map((a) => ({ id: a.id, amount: a.amount, status: a.transfer_status ?? "pending", reason: `${a.type}${a.reason ? ` · ${a.reason}` : ""}` }))} currency={s.currency_code} />
        </>
      ) : null}
    </SingleColumnPage>
  )
}

const SettlementPage = () => (
  <SettingsProviders>
    <SettlementDetail />
  </SettingsProviders>
)

export const handle = { breadcrumb: () => "Settlement", permissions: "payouts:view" }

export default SettlementPage
