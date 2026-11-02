import { TwoColumnPage, TwoColumnPageSkeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { useParams, type UIMatch } from "react-router-dom"

import { useStripeSettlement } from "../../../../../hooks/api/stripe"
import { providerIdOf } from "../../../../../../lib/provider-data"
import { SettlementLineType } from "../../../../../../types/common"
import { SettingsProviders } from "../../../../../providers/settings-providers"
import { SettlementDetailBreadcrumb } from "./breadcrumb"
import { SettlementBankPayoutSection } from "./components/settlement-bank-payout-section"
import { SettlementGeneralSection } from "./components/settlement-general-section"
import { SettlementLinesSection } from "./components/settlement-lines-section"
import { SettlementStatusAlert } from "./components/settlement-status-alert"
import { SettlementStoreSection } from "./components/settlement-store-section"

const SettlementDetail = () => {
  const { id } = useParams()
  const { settlement, isLoading, isError, error } = useStripeSettlement(id!)

  if (isError) {
    throw error
  }

  if (isLoading || !settlement) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={2} showJSON />
  }

  const lines = settlement.lines ?? []
  const ofType = (...types: SettlementLineType[]) => lines.filter((line) => types.includes(line.type))

  const payouts = ofType(SettlementLineType.PAYOUT).map((line) => ({
    id: line.id,
    amount: line.amount,
    status: line.payout?.status ?? null,
    reference: providerIdOf(line.payout?.data),
    order_id: line.payout?.order_id ?? null,
    order_display_id: line.payout?.order?.display_id ?? null,
  }))

  const reversals = ofType(SettlementLineType.REVERSAL).map((line) => ({
    id: line.id,
    amount: -Number(line.amount),
    status: line.payout_reversal?.status ?? null,
    reference: providerIdOf(line.payout_reversal?.data),
    order_id: line.payout_reversal?.payout?.order_id ?? null,
    order_display_id: line.payout_reversal?.payout?.order?.display_id ?? null,
  }))

  const adjustments = ofType(SettlementLineType.ADJUSTMENT_CREDIT, SettlementLineType.ADJUSTMENT_DEBIT).map((line) => ({
    id: line.id,
    amount: line.type === SettlementLineType.ADJUSTMENT_CREDIT ? line.amount : -Number(line.amount),
    status: line.adjustment?.status ?? null,
    reference: line.adjustment?.provider_transfer_id ?? null,
    reason: line.adjustment?.reason ?? null,
    type: line.adjustment?.type,
  }))

  return (
    <TwoColumnPage data={settlement} showJSON>
      <TwoColumnPage.Main>
        <WidgetZone id="stripe.settlements.detail.main" data={settlement}>
          <SettlementStatusAlert settlement={settlement} />
          <SettlementGeneralSection settlement={settlement} />
          <SettlementLinesSection
            title="Payouts"
            currencyCode={settlement.currency_code}
            lines={payouts}
            emptyMessage="No payouts landed in this period."
            testId="stripe-settlement-payouts"
          />
          <SettlementLinesSection
            title="Reversals"
            currencyCode={settlement.currency_code}
            lines={reversals}
            emptyMessage="No refunds were reversed in this period."
            testId="stripe-settlement-reversals"
          />
          <SettlementLinesSection
            title="Adjustments"
            currencyCode={settlement.currency_code}
            lines={adjustments}
            emptyMessage="No adjustments were applied in this period."
            testId="stripe-settlement-adjustments"
          />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="stripe.settlements.detail.side" data={settlement}>
          <SettlementStoreSection settlement={settlement} />
          <SettlementBankPayoutSection settlement={settlement} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

const SettlementDetailPage = () => (
  <SettingsProviders>
    <SettlementDetail />
  </SettingsProviders>
)

export const handle = {
  breadcrumb: (match: UIMatch) => <SettlementDetailBreadcrumb {...match} />,
  permissions: "payouts:view",
}

export default SettlementDetailPage
