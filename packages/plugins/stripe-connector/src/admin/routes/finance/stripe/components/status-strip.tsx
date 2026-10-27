import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"

import { useStripeStatus } from "../../../../hooks/api/stripe"
import { formatDate } from "../../../../lib/status"

const Count = ({ label, value, onClick }: { label: string; value: number; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-start gap-y-1 rounded-md px-3 py-2 text-left hover:bg-ui-bg-subtle-hover"
    data-testid={`stripe-failed-${label.toLowerCase()}`}
  >
    <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wide">
      {label}
    </Text>
    <span className={value > 0 ? "txt-large-plus text-ui-fg-error" : "txt-large-plus"}>{value}</span>
  </button>
)

export const StatusStrip = ({ onJump }: { onJump: (tab: string) => void }) => {
  const { data, isPending } = useStripeStatus({ refetchInterval: 30_000 })
  const failed = data?.failed

  return (
    <Container className="divide-y p-0" data-testid="stripe-status-strip">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Stripe</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Onboarding, captures, payouts, reversals and settlements, run on a fixed schedule.
          </Text>
        </div>
        {isPending ? (
          <StatusBadge color="grey">Checking</StatusBadge>
        ) : data?.configured ? (
          <StatusBadge color="green">Connected</StatusBadge>
        ) : (
          <StatusBadge color="orange">No Stripe API key in the plugin options</StatusBadge>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 px-3 py-2">
        <Count label="Captures" value={failed?.captures ?? 0} onClick={() => onJump("captures")} />
        <Count label="Payouts" value={failed?.payouts ?? 0} onClick={() => onJump("payouts")} />
        <Count label="Reversals" value={failed?.reversals ?? 0} onClick={() => onJump("payouts")} />
        <Count label="Settlements" value={(failed?.settlements ?? 0) + (failed?.adjustments ?? 0)} onClick={() => onJump("settlements")} />
        <div className="ml-auto px-3">
          <Text size="xsmall" className="text-ui-fg-subtle">
            Last webhook {formatDate(data?.last_webhook_at ?? null)}
          </Text>
        </div>
      </div>
    </Container>
  )
}
