import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useSettlement } from "../../../hooks/api/settlements"
import { SettlementGeneralSection } from "./components/settlement-general-section"
import { SettlementLinesSection } from "./components/settlement-lines-section"
import { SettlementPayoutSection } from "./components/settlement-payout-section"
import { SettlementStoreSection } from "./components/settlement-store-section"
import { settlementLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof settlementLoader>
  >

  const { settlement, isLoading, isError, error } = useSettlement(
    id!,
    undefined,
    { initialData },
  )

  if (isLoading || !settlement) {
    return (
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={settlement} showJSON>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={settlement} showJSON>
      <TwoColumnPage.Main>
        <WidgetZone id="settlements.detail.main" data={settlement}>
          <SettlementGeneralSection settlement={settlement} />
          <SettlementLinesSection
            settlement={settlement}
            kind="transfers"
            lines={settlement.transfers}
          />
          <SettlementLinesSection
            settlement={settlement}
            kind="reversals"
            lines={settlement.reversals}
          />
          <SettlementLinesSection
            settlement={settlement}
            kind="adjustments"
            lines={settlement.adjustments.map((line) => ({
              id: line.id,
              type: line.type,
              amount: line.amount,
              status: line.transfer_status ?? "pending",
              reason: line.reason,
              transfer_id: line.transfer_id,
            }))}
          />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="settlements.detail.side" data={settlement}>
          <SettlementPayoutSection settlement={settlement} />
          <SettlementStoreSection settlement={settlement} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const SettlementDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: SettlementGeneralSection,
  MainLinesSection: SettlementLinesSection,
  SidebarPayoutSection: SettlementPayoutSection,
  SidebarStoreSection: SettlementStoreSection,
})
