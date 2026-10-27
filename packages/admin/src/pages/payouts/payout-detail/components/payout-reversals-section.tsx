import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminPayout } from "../../../../hooks/api/payouts"
import { useDate } from "../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { getPayoutStatusProps } from "../../common/utils"

export const PayoutReversalsSection = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const reversals = payout.reversals ?? []

  return (
    <Container className="divide-y p-0" data-testid="payout-reversals-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.reversals.header")}</Heading>
      </div>
      {reversals.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payouts.reversals.empty")}
          </Text>
        </div>
      ) : (
        reversals.map((reversal) => {
          const status = getPayoutStatusProps(reversal.status, t)

          return (
            <div
              key={reversal.id}
              className="flex items-start justify-between gap-x-4 px-6 py-4"
              data-testid={`payout-reversal-${reversal.id}`}
            >
              <div className="flex flex-col gap-y-1">
                <Text size="small" leading="compact" weight="plus">
                  {getStylizedAmount(Number(reversal.amount), payout.currency_code)}
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {reversal.refund_id
                    ? t("payouts.reversals.refund", { id: reversal.refund_id })
                    : getFullDate({ date: reversal.created_at, includeTime: true })}
                </Text>
                {reversal.status_reason && (
                  <Text size="small" leading="compact" className="text-ui-fg-muted">
                    {reversal.status_reason}
                  </Text>
                )}
              </div>
              <StatusBadge color={status.color}>{status.label}</StatusBadge>
            </div>
          )
        })
      )}
    </Container>
  )
}
