import { ArrowPath } from "@medusajs/icons"
import { Badge, Container, Copy, Heading, StatusBadge } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { AdminTransfer } from "../../../../hooks/api/transfers"
import { useDate } from "../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { useRetryTransferAction } from "../../common/hooks/use-retry-transfer-action"
import { getTransferStatusProps, getTransferTypeLabel } from "../../common/utils"

export const TransferGeneralSection = ({
  transfer,
}: {
  transfer: AdminTransfer
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()
  const { handleRetry, canRetry } = useRetryTransferAction(transfer)

  const status = getTransferStatusProps(transfer.status, t)

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-"

  return (
    <Container className="divide-y p-0" data-testid="transfer-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="transfer-general-section-heading">
          {getStylizedAmount(Number(transfer.amount), transfer.currency_code)}
        </Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge
            color={status.color}
            data-testid="transfer-general-section-status-badge"
          >
            {status.label}
          </StatusBadge>
          <ActionMenu
            data-testid="transfer-general-section-action-menu"
            groups={[
              {
                actions: [
                  {
                    label: t("transfers.actions.retry"),
                    icon: <ArrowPath />,
                    onClick: handleRetry,
                    permission: "payouts:edit",
                    disabled: !canRetry,
                    disabledTooltip: t("transfers.retry.disabledTooltip"),
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title={t("fields.type")}
        value={getTransferTypeLabel(transfer.type, t)}
      />
      <SectionRow
        title={t("transfers.fields.provider")}
        value={<Badge size="2xsmall">{transfer.provider_id}</Badge>}
      />
      <SectionRow
        title={t("transfers.fields.providerTransferId")}
        value={
          transfer.provider_transfer_id ? (
            <Copy
              asChild
              content={transfer.provider_transfer_id}
              className="cursor-pointer"
              data-testid="transfer-general-section-provider-transfer-copy"
            >
              <Badge size="2xsmall" className="text-ui-tag-neutral-text">
                {transfer.provider_transfer_id}
              </Badge>
            </Copy>
          ) : null
        }
      />
      <SectionRow
        title={t("transfers.fields.sourceCreatedAt")}
        value={formatDate(transfer.source_created_at)}
      />
      <SectionRow
        title={t("fields.createdAt")}
        value={formatDate(transfer.created_at)}
      />
      <SectionRow
        title={t("fields.updatedAt")}
        value={formatDate(transfer.updated_at)}
      />
    </Container>
  )
}
