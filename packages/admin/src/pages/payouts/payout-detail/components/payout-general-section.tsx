import { ArrowPath } from "@medusajs/icons"
import { Badge, Container, Copy, Heading, StatusBadge } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { AdminPayout } from "../../../../hooks/api/payouts"
import { useDate } from "../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { useRetryPayoutAction } from "../../common/hooks/use-retry-payout-action"
import { getPayoutStatusProps } from "../../common/utils"

export const PayoutGeneralSection = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()
  const { handleRetry, canRetry } = useRetryPayoutAction(payout)

  const status = getPayoutStatusProps(payout.status, t)

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-"

  return (
    <Container className="divide-y p-0" data-testid="payout-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="payout-general-section-heading">
          {getStylizedAmount(Number(payout.amount), payout.currency_code)}
        </Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge
            color={status.color}
            data-testid="payout-general-section-status-badge"
          >
            {status.label}
          </StatusBadge>
          <ActionMenu
            data-testid="payout-general-section-action-menu"
            groups={[
              {
                actions: [
                  {
                    label: t("payouts.actions.retry"),
                    icon: <ArrowPath />,
                    onClick: handleRetry,
                    permission: "payouts:edit",
                    disabled: !canRetry,
                    disabledTooltip: t("payouts.retry.disabledTooltip"),
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow title={t("fields.id")} value={`#${payout.display_id}`} />
      <SectionRow
        title={t("payouts.fields.providerPayoutId")}
        value={
          payout.provider_payout_id ? (
            <Copy
              asChild
              content={payout.provider_payout_id}
              className="cursor-pointer"
              data-testid="payout-general-section-provider-payout-copy"
            >
              <Badge size="2xsmall" className="text-ui-tag-neutral-text">
                {payout.provider_payout_id}
              </Badge>
            </Copy>
          ) : null
        }
      />
      <SectionRow
        title={t("fields.createdAt")}
        value={formatDate(payout.created_at)}
      />
      <SectionRow
        title={t("fields.updatedAt")}
        value={formatDate(payout.updated_at)}
      />
    </Container>
  )
}
