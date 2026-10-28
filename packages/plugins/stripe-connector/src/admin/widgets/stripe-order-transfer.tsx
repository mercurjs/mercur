import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useRetryPayout, useStripePayouts } from "../hooks/api/stripe"
import { useActionBlocker } from "../hooks/use-action-blocker"
import { SettingsProviders } from "../providers/settings-providers"
import { PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL, formatAmount, providerIdOf } from "../lib/status"

type Line = {
  id: string
  title: string
  amount: unknown
  currency_code: string
  status: string
  status_reason: string | null
  provider_id: string | null
  payout_id: string
}

const Body = ({ orderId }: { orderId: string }) => {
  const { payouts, isPending } = useStripePayouts({ limit: 20, offset: 0, order_id: orderId })
  const retry = useRetryPayout()
  const blocker = useActionBlocker("payouts", "edit")
  const rows: Line[] = (payouts ?? []).flatMap((payout) => [
    {
      id: payout.id,
      title: "Payout",
      amount: payout.amount,
      currency_code: payout.currency_code,
      status: payout.status,
      status_reason: payout.status_reason,
      provider_id: providerIdOf(payout.data),
      payout_id: payout.id,
    },
    ...(payout.reversals ?? []).map((reversal) => ({
      id: reversal.id,
      title: "Reversal",
      amount: reversal.amount,
      currency_code: payout.currency_code,
      status: reversal.status,
      status_reason: reversal.status_reason,
      provider_id: providerIdOf(reversal.data),
      payout_id: payout.id,
    })),
  ])

  return (
    <Container className="divide-y p-0" data-testid="stripe-order-transfers">
      <div className="px-6 py-4">
        <Heading>Stripe payouts</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          What moved to the seller for this order, and what came back.
        </Text>
      </div>
      {isPending ? <SectionRow title="Loading" value="-" /> : null}
      {!isPending && !rows.length ? <SectionRow title="No payout yet" value="Appears within five minutes of fulfillment and capture." /> : null}
      {rows.map((t) => (
        <SectionRow
          key={t.id}
          title={t.title}
          value={
            <span className="flex items-center gap-x-2">
              <span>{formatAmount(t.amount, t.currency_code)}</span>
              <StatusBadge color={PAYOUT_STATUS_COLOR[t.status] ?? "grey"}>{PAYOUT_STATUS_LABEL[t.status] ?? t.status}</StatusBadge>
              {t.status_reason ? <span className="text-ui-fg-subtle">{t.status_reason}</span> : null}
              {t.provider_id ? <span className="text-ui-fg-subtle">{t.provider_id}</span> : null}
              {t.title === "Payout" && ["failed", "on_hold"].includes(t.status) ? (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={blocker.disabled}
                  isLoading={retry.isPending}
                  onClick={() => retry.mutate(t.payout_id, { onSuccess: () => toast.success("Retried"), onError: (e) => toast.error(e.message) })}
                >
                  Retry
                </Button>
              ) : null}
            </span>
          }
        />
      ))}
    </Container>
  )
}

const StripeOrderTransferWidget = ({ data }: DetailWidgetProps<{ id?: string }>) => {
  const orderId = data?.id ?? ""
  if (!orderId) return null
  return (
    <SettingsProviders>
      <Body orderId={orderId} />
    </SettingsProviders>
  )
}

export const config = defineWidgetConfig({
  zone: "orders.detail.side",
  id: "stripe-order-transfer",
  permission: "payouts:view",
})

export default StripeOrderTransferWidget
