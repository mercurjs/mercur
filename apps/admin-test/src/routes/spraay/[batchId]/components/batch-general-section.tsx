import { ArrowUpRightOnBox, ExclamationCircle, XCircle } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { ActionMenu, SectionRow } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import type { SpraayBatch } from "../../../../lib/spraay/api"
import { basescanAddress, basescanTx, formatUsdc, shortHex } from "../../../../lib/spraay/format"
import { getBatchStatusProps, isCancelable, isHoldingPayouts } from "../../../../lib/spraay/status"
import { useCancelBatchAction } from "../../../../lib/spraay/use-cancel-batch-action"

const ExternalLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex items-center gap-x-1 font-mono"
  >
    <Text size="small" leading="compact">
      {label}
    </Text>
    <ArrowUpRightOnBox />
  </a>
)

export const BatchGeneralSection = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const { cancel } = useCancelBatchAction()
  const { color, label } = getBatchStatusProps(batch.status, t)
  const fee = batch.settled_fee_amount ?? batch.fee_amount

  return (
    <Container className="divide-y p-0" data-testid="spraay-batch-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("spraay.detail.title", { id: shortHex(batch.id, 8) })}</Heading>
          <Text size="small" className="text-ui-fg-subtle font-mono">
            {batch.id}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={color} data-testid="spraay-batch-status">
            {label}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <XCircle />,
                    label: t("spraay.actions.cancel"),
                    disabled: !isCancelable(batch),
                    onClick: () => cancel(batch),
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {batch.error_message && (
        <div className="text-ui-fg-error flex items-start gap-x-2 px-6 py-4" data-testid="spraay-batch-error">
          <ExclamationCircle className="mt-0.5 shrink-0" />
          <Text size="small" leading="compact">
            {batch.error_message}
          </Text>
        </div>
      )}

      {isHoldingPayouts(batch) && (
        <div className="bg-ui-bg-subtle px-6 py-4" data-testid="spraay-batch-held-notice">
          <Text size="small" leading="compact" weight="plus">
            {t("spraay.detail.heldTitle")}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("spraay.detail.heldDescription", { nonce: batch.unsigned_tx_nonce })}
          </Text>
        </div>
      )}

      <SectionRow title={t("spraay.fields.total")} value={formatUsdc(batch.total_amount)} />
      <SectionRow
        title={batch.settled_fee_amount ? t("spraay.fields.feeSettled") : t("spraay.fields.feeEstimated")}
        value={formatUsdc(fee)}
      />
      <SectionRow title={t("spraay.fields.recipients")} value={String(batch.recipient_count)} />
      <SectionRow
        title={t("spraay.fields.treasury")}
        value={<ExternalLink href={basescanAddress(batch.treasury_address)} label={shortHex(batch.treasury_address)} />}
      />
      <SectionRow
        title={t("spraay.fields.txHash")}
        value={batch.tx_hash ? <ExternalLink href={basescanTx(batch.tx_hash)} label={shortHex(batch.tx_hash)} /> : "-"}
      />
      <SectionRow title={t("spraay.fields.block")} value={batch.block_number ?? "-"} />
    </Container>
  )
}
