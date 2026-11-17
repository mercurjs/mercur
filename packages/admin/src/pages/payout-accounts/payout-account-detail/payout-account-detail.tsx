import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  detailPageDefaultEntries,
} from "@mercurjs/dashboard-shared"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { usePayoutAccount } from "../../../hooks/api/payout-accounts"
import { PayoutAccountCapabilitiesSection } from "./components/payout-account-capabilities-section"
import { PayoutAccountGeneralSection } from "./components/payout-account-general-section"
import { PayoutsSection } from "../../payouts/common/components/payouts-section"
import { PayoutAccountStatusAlert } from "./components/payout-account-status-alert"
import { PayoutAccountStoreSection } from "./components/payout-account-store-section"
import { payoutAccountLoader } from "./loader"

export const PayoutAccountDetailPage = () => {
  const { id } = useParams()

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof payoutAccountLoader>
  >

  const { payout_account, isLoading, isError, error } = usePayoutAccount(
    id!,
    { fields: "+onboarding.data" },
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

  return (
    <LayoutComposer
      widgetsZonePrefix="payout_accounts.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={payout_account}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PayoutAccountStatusAlert">
              <PayoutAccountStatusAlert account={payout_account} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PayoutAccountGeneralSection">
              <PayoutAccountGeneralSection account={payout_account} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PayoutsSection">
              <PayoutsSection
                scope={{ account_id: payout_account.id }}
                prefix="pacpay"
                data-testid="payout-account-payouts-section"
              />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(payout_account, { metadata: false })}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="PayoutAccountStoreSection">
              <PayoutAccountStoreSection account={payout_account} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PayoutAccountCapabilitiesSection">
              <PayoutAccountCapabilitiesSection account={payout_account} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
