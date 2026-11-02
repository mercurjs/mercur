import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { ArrowPath } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"
import { ActionMenu, getStylizedAmount, useDate } from "@mercurjs/dashboard-shared"
import { Link } from "react-router-dom"

import { useRetryPayout, useStripePayouts } from "../hooks/api/stripe"
import type { PayoutRow } from "../lib/client"
import {
  PAYOUT_STATUS_COLOR,
  PAYOUT_STATUS_LABEL,
  RETRYABLE_STATUSES,
  payoutStatusDetail,
  payoutStatusReasonLabel,
  statusProps,
  toNumber,
} from "../lib/status"
import { SettingsProviders } from "../providers/settings-providers"

type Line = {
  id: string
  title: string
  link: string | null
  date: Date | string
  amount: number
  currency_code: string
  status: string
  status_reason: string | null
  status_detail: string | null
  retry_id: string | null
}

const toLines = (payouts: PayoutRow[]): Line[] =>
  payouts.flatMap((payout) => [
    {
      id: payout.id,
      title: `Payout #${payout.display_id}`,
      link: `/payouts/${payout.id}`,
      date: payout.created_at,
      amount: toNumber(payout.amount),
      currency_code: payout.currency_code,
      status: payout.status,
      status_reason: payout.status_reason,
      status_detail: payoutStatusDetail(payout.data),
      retry_id: RETRYABLE_STATUSES.includes(payout.status) ? payout.id : null,
    },
    ...(payout.reversals ?? []).map((reversal) => ({
      id: reversal.id,
      title: "Reversal",
      link: null,
      date: reversal.created_at,
      amount: -toNumber(reversal.amount),
      currency_code: payout.currency_code,
      status: reversal.status,
      status_reason: reversal.status_reason,
      status_detail: payoutStatusDetail(reversal.data),
      retry_id: null,
    })),
  ])

const LineRow = ({ line }: { line: Line }) => {
  const { getFullDate } = useDate()
  const prompt = usePrompt()
  const { mutateAsync } = useRetryPayout()
  const status = statusProps(line.status, PAYOUT_STATUS_COLOR, PAYOUT_STATUS_LABEL)

  const handleRetry = async () => {
    const confirmed = await prompt({
      title: "Retry payout?",
      description: "The payout is sent to Stripe again.",
      confirmText: "Retry",
      cancelText: "Cancel",
    })

    if (!confirmed || !line.retry_id) {
      return
    }

    await mutateAsync(line.retry_id, {
      onSuccess: () => toast.success("Payout retried"),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <div className="flex flex-col gap-y-2 px-6 py-4" data-testid={`stripe-order-payout-${line.id}`}>
      <div className="flex items-start justify-between gap-x-4">
        <div className="flex min-w-0 flex-col">
          {line.link ? (
            <Link
              to={line.link}
              className="txt-compact-small-plus text-ui-fg-base hover:text-ui-fg-interactive transition-fg"
            >
              {line.title}
            </Link>
          ) : (
            <Text size="small" leading="compact" weight="plus">
              {line.title}
            </Text>
          )}
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {getFullDate({ date: line.date, includeTime: true })}
          </Text>
        </div>
        <div className="flex shrink-0 items-center gap-x-2">
          <Text size="small" leading="compact">
            {getStylizedAmount(line.amount, line.currency_code)}
          </Text>
          <StatusBadge color={status.color}>{status.label}</StatusBadge>
          {line.retry_id ? (
            <ActionMenu
              groups={[
                {
                  actions: [
                    { label: "Retry", icon: <ArrowPath />, onClick: handleRetry, permission: "payouts:edit" },
                  ],
                },
              ]}
            />
          ) : null}
        </div>
      </div>
      {line.status_reason ? (
        <div className="flex flex-col gap-y-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle break-words">
            {payoutStatusReasonLabel(line.status_reason)}
          </Text>
          {line.status_detail ? (
            <Text size="xsmall" leading="compact" className="text-ui-fg-muted break-words">
              {line.status_detail}
            </Text>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

const Body = ({ orderId }: { orderId: string }) => {
  const { payouts, isPending } = useStripePayouts({ limit: 20, offset: 0, order_id: orderId })

  if (isPending) {
    return null
  }

  const lines = toLines((payouts ?? []) as PayoutRow[])

  return (
    <Container className="divide-y p-0" data-testid="stripe-order-transfers">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2" data-testid="stripe-order-transfers-heading">
          Stripe payouts
        </Heading>
      </div>
      {lines.length ? (
        lines.map((line) => <LineRow key={line.id} line={line} />)
      ) : (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No payout yet
          </Text>
        </div>
      )}
    </Container>
  )
}

const StripeOrderTransferWidget = ({ data }: DetailWidgetProps<{ id?: string }>) => {
  if (!data?.id) {
    return null
  }

  return (
    <SettingsProviders>
      <Body orderId={data.id} />
    </SettingsProviders>
  )
}

export const config = defineWidgetConfig({
  zone: "orders.detail.side",
  id: "stripe-order-transfer",
  permission: "payouts:view",
})

export default StripeOrderTransferWidget
