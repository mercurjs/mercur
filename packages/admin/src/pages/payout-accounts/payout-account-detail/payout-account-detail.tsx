import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone } from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { usePayoutAccount } from "../../../hooks/api/payout-accounts"
import { PayoutAccountCapabilitiesSection } from "./components/payout-account-capabilities-section"
import { PayoutAccountGeneralSection } from "./components/payout-account-general-section"
import { PayoutAccountRequirementsSection } from "./components/payout-account-requirements-section"
import { PayoutAccountStoreSection } from "./components/payout-account-store-section"
import { payoutAccountLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof payoutAccountLoader>
  >

  const { payout_account, isLoading, isError, error } = usePayoutAccount(
    id!,
    undefined,
    { initialData },
  )

  if (isLoading || !payout_account) {
    return (
      <TwoColumnPageSkeleton mainSections={2} sidebarSections={2} showJSON />
    )
  }

  if (isError) {
    throw error
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={payout_account} showJSON>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={payout_account} showJSON>
      <TwoColumnPage.Main>
        <WidgetZone id="payout_accounts.detail.main" data={payout_account}>
          <PayoutAccountGeneralSection account={payout_account} />
          <PayoutAccountRequirementsSection account={payout_account} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="payout_accounts.detail.side" data={payout_account}>
          <PayoutAccountStoreSection account={payout_account} />
          <PayoutAccountCapabilitiesSection account={payout_account} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const PayoutAccountDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PayoutAccountGeneralSection,
  MainRequirementsSection: PayoutAccountRequirementsSection,
  SidebarStoreSection: PayoutAccountStoreSection,
  SidebarCapabilitiesSection: PayoutAccountCapabilitiesSection,
})
