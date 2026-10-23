import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useRetryTransfer, useStripeTransfers } from "../hooks/api/stripe"
import { useActionBlocker } from "../hooks/use-action-blocker"
import { SettingsProviders } from "../providers/settings-providers"
import { TRANSFER_STATUS_COLOR, TRANSFER_STATUS_LABEL, formatAmount } from "../lib/status"

const Body = ({ orderId }: { orderId: string }) => {
  const { data, isPending } = useStripeTransfers({ limit: 20, offset: 0, order_id: orderId })
  const retry = useRetryTransfer()
  const blocker = useActionBlocker("payouts", "edit")
  const rows = data?.transfers ?? []

  return (
    <Container className="divide-y p-0" data-testid="stripe-order-transfers">
      <div className="px-6 py-4">
        <Heading>Stripe transfers</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          What moved to the seller for this order, and what came back.
        </Text>
      </div>
      {isPending ? <SectionRow title="Loading" value="-" /> : null}
      {!isPending && !rows.length ? <SectionRow title="No transfer yet" value="Appears within five minutes of fulfillment and capture." /> : null}
      {rows.map((t) => (
        <SectionRow
          key={t.id}
          title={t.type === "refund_reversal" ? "Reversal" : t.type === "tax" ? "Tax" : "Transfer"}
          value={
            <span className="flex items-center gap-x-2">
              <span>{formatAmount(t.amount, t.currency_code)}</span>
              <StatusBadge color={TRANSFER_STATUS_COLOR[t.status] ?? "grey"}>{TRANSFER_STATUS_LABEL[t.status] ?? t.status}</StatusBadge>
              {t.status_reason ? <span className="text-ui-fg-subtle">{t.status_reason}</span> : null}
              {t.provider_transfer_id ? <span className="text-ui-fg-subtle">{t.provider_transfer_id}</span> : null}
              {["failed", "on_hold"].includes(t.status) ? (
                <Button
                  size="small"
                  variant="secondary"
                  disabled={blocker.disabled}
                  isLoading={retry.isPending}
                  onClick={() => retry.mutate(t.id, { onSuccess: () => toast.success("Retried"), onError: (e) => toast.error(e.message) })}
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
