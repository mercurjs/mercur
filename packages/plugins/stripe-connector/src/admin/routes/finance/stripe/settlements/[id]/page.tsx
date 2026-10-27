import { TwoColumnPage, TwoColumnPageSkeleton, WidgetZone } from "@mercurjs/dashboard-shared"
import { useParams, type UIMatch } from "react-router-dom"

import { useStripeSettlement } from "../../../../../hooks/api/stripe"
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

  const adjustments = settlement.adjustments.map((adjustment) => ({
    id: adjustment.id,
    amount: adjustment.type === "extra_credit" ? adjustment.amount : -Number(adjustment.amount),
    status: adjustment.status,
    reference: adjustment.provider_transfer_id,
    reason: adjustment.reason,
    type: adjustment.type,
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
            lines={settlement.payouts.map((line) => ({ ...line, reference: line.provider_id }))}
            testId="stripe-settlement-payouts"
          />
          <SettlementLinesSection
            title="Reversals"
            currencyCode={settlement.currency_code}
            lines={settlement.reversals.map((line) => ({
              ...line,
              amount: -Number(line.amount),
              reference: line.provider_id,
            }))}
            testId="stripe-settlement-reversals"
          />
          <SettlementLinesSection
            title="Adjustments"
            currencyCode={settlement.currency_code}
            lines={adjustments}
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
