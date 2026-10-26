import { ArrowUpRightOnBox } from "@medusajs/icons"
import { Badge, Container, Copy, Heading, IconButton, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { SectionRow } from "../../../../components/common/section"
import { AdminSettlement } from "../../../../hooks/api/settlements"
import { useDate } from "../../../../hooks/use-date"
import { getSettlementPayoutStatusProps } from "../../common/utils"

export const SettlementPayoutSection = ({
  settlement,
}: {
  settlement: AdminSettlement
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()
  const payout = settlement.payout

  return (
    <Container className="divide-y p-0" data-testid="settlement-payout-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("settlements.fields.payout")}</Heading>
        {payout && (
          <IconButton size="small" variant="transparent" asChild>
            <Link to={`/payouts/${payout.id}`} data-testid="settlement-payout-link">
              <ArrowUpRightOnBox />
            </Link>
          </IconButton>
        )}
      </div>
      {payout ? (
        <>
          <SectionRow
            title={t("fields.status")}
            value={(() => {
              const { color, label } = getSettlementPayoutStatusProps(payout.status, t)
              return <StatusBadge color={color}>{label}</StatusBadge>
            })()}
          />
          <SectionRow title={t("fields.id")} value={`#${payout.display_id}`} />
          <SectionRow
            title={t("settlements.fields.providerPayoutId")}
            value={
              payout.provider_payout_id ? (
                <Copy asChild content={payout.provider_payout_id} className="cursor-pointer">
                  <Badge size="2xsmall" className="text-ui-tag-neutral-text">
                    {payout.provider_payout_id}
                  </Badge>
                </Copy>
              ) : null
            }
          />
          <SectionRow
            title={t("settlements.fields.statusReason")}
            value={payout.status_reason}
          />
          <SectionRow
            title={t("fields.createdAt")}
            value={getFullDate({ date: payout.created_at, includeTime: true })}
          />
        </>
      ) : (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("settlements.noPayout")}
          </Text>
        </div>
      )}
    </Container>
  )
}
