import { ArrowPath } from "@medusajs/icons"
import { Container, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { ActionMenu, SectionRow, getStylizedAmount, useDate } from "@mercurjs/dashboard-shared"

import { useRetrySettlementPayout } from "../../../../../../hooks/api/stripe"
import type { SettlementDetail } from "../../../../../../lib/client"
import {
  RETRYABLE_STATUSES,
  SETTLEMENT_STATUS_COLOR,
  SETTLEMENT_STATUS_LABEL,
  formatSettlementPayout,
  statusProps,
  toNumber,
} from "../../../../../../lib/status"

export const SettlementGeneralSection = ({ settlement }: { settlement: SettlementDetail }) => {
  const prompt = usePrompt()
  const { getFullDate } = useDate()
  const { mutateAsync } = useRetrySettlementPayout(settlement.id)

  const status = statusProps(settlement.status, SETTLEMENT_STATUS_COLOR, SETTLEMENT_STATUS_LABEL)
  const canRetry = !!settlement.payout_status && RETRYABLE_STATUSES.includes(settlement.payout_status)
  const amount = (value: unknown) => getStylizedAmount(toNumber(value), settlement.currency_code)

  const handleRetry = async () => {
    const confirmed = await prompt({
      title: "Retry bank payout?",
      description: `Stripe will be asked again to pay ${formatSettlementPayout(settlement)} to the store's bank account.`,
      confirmText: "Retry",
      cancelText: "Cancel",
    })

    if (!confirmed) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => toast.success("Bank payout retried"),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Container className="divide-y p-0" data-testid="stripe-settlement-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="stripe-settlement-heading">Settlement #{settlement.display_id}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={status.color}>{status.label}</StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Retry bank payout",
                    icon: <ArrowPath />,
                    onClick: handleRetry,
                    permission: "payouts:edit",
                    disabled: !canRetry,
                    disabledTooltip: "Only failed, held or pending bank payouts can be retried",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title="Period"
        value={`${getFullDate({ date: settlement.period_start, includeTime: true })} – ${getFullDate({
          date: settlement.period_end,
          includeTime: true,
        })}`}
      />
      <SectionRow title="Payouts" value={amount(settlement.payouts_total)} />
      <SectionRow title="Reversals" value={amount(-toNumber(settlement.reversals_total))} />
      <SectionRow title="Adjustments" value={amount(settlement.adjustments_total)} />
      <SectionRow title="Net amount" value={amount(settlement.amount)} />
    </Container>
  )
}
