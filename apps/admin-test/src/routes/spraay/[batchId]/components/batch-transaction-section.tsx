import { Button, Container, Copy, Heading, Text, Tooltip, toast } from "@medusajs/ui"
import { SectionRow, usePermissions } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { usePrepareSpraayBatch, type SpraayBatch } from "../../../../lib/spraay/api"
import { shortHex } from "../../../../lib/spraay/format"

const REQUIRED_CONFIRMATIONS = 10

export const getSigningRequest = (batch: SpraayBatch) => ({
  from: batch.treasury_address,
  to: batch.unsigned_tx_to,
  data: batch.unsigned_tx_data,
  value: batch.unsigned_tx_value ?? "0",
  chainId: batch.unsigned_tx_chain_id,
  nonce: batch.unsigned_tx_nonce,
  gas: batch.unsigned_tx_gas,
})

const PrepareAction = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const { mutate, isPending } = usePrepareSpraayBatch(batch.id, {
    onSuccess: ({ approval_required }) => {
      toast.success(t("spraay.prepare.successToast"))
      if (approval_required?.amount) {
        toast.warning(
          t("spraay.prepare.approvalRequired", {
            amount: approval_required.amountFormatted ?? approval_required.amount,
            spender: approval_required.spender,
          })
        )
      }
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="flex items-center justify-between gap-x-4 px-6 py-4">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {t("spraay.prepare.hint")}
      </Text>
      <Button size="small" onClick={() => mutate()} isLoading={isPending} data-testid="spraay-batch-prepare-button">
        {t("spraay.actions.prepare")}
      </Button>
    </div>
  )
}

export const BatchTransactionSection = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const hasSigningRequest = !!batch.unsigned_tx_data
  const { isEnforced, can } = usePermissions()
  // The sign endpoint refuses when permissions are not enforced, so the button must too.
  const canSign = isEnforced && can("spraay.sign", "edit")

  return (
    <Container className="divide-y p-0" data-testid="spraay-batch-transaction-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">{t("spraay.transaction.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("spraay.transaction.subtitle")}
          </Text>
        </div>
        {batch.status === "awaiting_signature" &&
          (canSign ? (
            <Button size="small" variant="secondary" asChild data-testid="spraay-batch-sign-button">
              <Link to="sign">{t("spraay.actions.submitSigned")}</Link>
            </Button>
          ) : (
            <Tooltip content={t("spraay.sign.notPermitted")}>
              <Button size="small" variant="secondary" disabled data-testid="spraay-batch-sign-button">
                {t("spraay.actions.submitSigned")}
              </Button>
            </Tooltip>
          ))}
      </div>

      {batch.status === "assembling" && <PrepareAction batch={batch} />}

      {hasSigningRequest && (
        <>
          <SectionRow title={t("spraay.transaction.to")} value={shortHex(batch.unsigned_tx_to, 10)} />
          <SectionRow title={t("spraay.transaction.chainId")} value={String(batch.unsigned_tx_chain_id ?? "-")} />
          <SectionRow title={t("spraay.transaction.nonce")} value={String(batch.unsigned_tx_nonce ?? "-")} />
          <SectionRow title={t("spraay.transaction.gas")} value={batch.unsigned_tx_gas ?? "-"} />
          <SectionRow title={t("spraay.transaction.value")} value={batch.unsigned_tx_value ?? "0"} />
          <SectionRow
            title={t("spraay.transaction.calldata")}
            value={
              <div className="flex items-center gap-x-2">
                <Text size="small" leading="compact" className="font-mono">
                  {shortHex(batch.unsigned_tx_data, 12)}
                </Text>
                <Copy content={batch.unsigned_tx_data ?? ""} data-testid="spraay-batch-copy-calldata" />
              </div>
            }
          />
          <div className="flex items-center justify-between gap-x-4 px-6 py-4">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {t("spraay.transaction.copyHint")}
            </Text>
            <Copy content={JSON.stringify(getSigningRequest(batch), null, 2)} asChild>
              <Button size="small" variant="secondary" data-testid="spraay-batch-copy-request">
                {t("spraay.actions.copyRequest")}
              </Button>
            </Copy>
          </div>
        </>
      )}

      {(batch.status === "broadcasting" || batch.status === "confirming") && (
        <div className="px-6 py-4" data-testid="spraay-batch-confirming-notice">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("spraay.transaction.confirming", { count: REQUIRED_CONFIRMATIONS })}
          </Text>
        </div>
      )}
    </Container>
  )
}
