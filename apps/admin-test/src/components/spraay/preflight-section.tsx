import { ArrowPath, ExclamationCircle } from "@medusajs/icons"
import { Container, Heading, IconButton, StatusBadge, Text, Tooltip } from "@medusajs/ui"
import { SectionRow, Skeleton } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { useSpraayPreflight } from "../../lib/spraay/api"
import { formatEth, formatUsdc, shortHex } from "../../lib/spraay/format"

export const SpraayPreflightSection = () => {
  const { t } = useTranslation()
  const { preflight, isLoading, isFetching, isError, error, refetch } = useSpraayPreflight({
    refetchInterval: 60_000,
  })

  if (isError) {
    throw error
  }

  const checks = preflight?.checks

  return (
    <Container className="divide-y p-0" data-testid="spraay-preflight-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("spraay.preflight.title")}</Heading>
        <div className="flex items-center gap-x-2">
          {preflight && (
            <StatusBadge color={preflight.ready ? "green" : "red"} data-testid="spraay-preflight-status">
              {preflight.ready ? t("spraay.preflight.ready") : t("spraay.preflight.notReady")}
            </StatusBadge>
          )}
          <Tooltip content={t("spraay.preflight.refresh")}>
            <IconButton
              size="small"
              variant="transparent"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="spraay-preflight-refresh"
            >
              <ArrowPath />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {isLoading || !preflight ? (
        <div className="flex flex-col gap-y-2 px-6 py-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : (
        <>
          {preflight.problems.length > 0 && (
            <div className="flex flex-col gap-y-2 px-6 py-4" data-testid="spraay-preflight-problems">
              {preflight.problems.map((problem) => (
                <div key={problem} className="text-ui-fg-error flex items-start gap-x-2">
                  <ExclamationCircle className="mt-0.5 shrink-0" />
                  <Text size="small" leading="compact">
                    {problem}
                  </Text>
                </div>
              ))}
            </div>
          )}
          <SectionRow title={t("spraay.fields.treasury")} value={shortHex(checks?.treasury_address)} />
          {checks?.rpc && (
            <>
              <SectionRow title={t("spraay.preflight.usdcBalance")} value={formatUsdc(checks.usdc_balance_raw)} />
              <SectionRow title={t("spraay.preflight.usdcAllowance")} value={formatUsdc(checks.usdc_allowance_raw)} />
              <SectionRow title={t("spraay.preflight.required")} value={formatUsdc(checks.required_usdc_raw)} />
              <SectionRow title={t("spraay.preflight.ethBalance")} value={formatEth(checks.eth_balance_raw)} />
              <SectionRow
                title={t("spraay.preflight.contract")}
                value={
                  checks.contract_paused
                    ? t("spraay.preflight.paused")
                    : t("spraay.preflight.active", { bps: checks.fee_bps })
                }
              />
              <SectionRow
                title={t("spraay.preflight.chain")}
                value={t("spraay.preflight.chainValue", { chainId: checks.chain_id, block: checks.block_number })}
              />
            </>
          )}
        </>
      )}
    </Container>
  )
}
