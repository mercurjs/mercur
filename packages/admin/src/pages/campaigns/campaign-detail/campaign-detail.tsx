import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"
import { useCampaign } from "../../../hooks/api/campaigns"
import { CampaignBudget } from "./components/campaign-budget"
import { CampaignConfigurationSection } from "./components/campaign-configuration-section"
import { CampaignGeneralSection } from "./components/campaign-general-section"
import { CampaignPromotionSection } from "./components/campaign-promotion-section"
import { campaignLoader } from "./loader"
import { CAMPAIGN_DETAIL_FIELDS } from "./constants"

export const CampaignDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof campaignLoader>
  >

  const { id } = useParams()
  const query = useLinkQuery("campaign", CAMPAIGN_DETAIL_FIELDS)
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    query,
    { initialData }
  )

  if (isLoading || !campaign) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={2}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="campaigns.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={campaign}
      data-testid="campaign-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CampaignGeneralSection">
              <CampaignGeneralSection campaign={campaign} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CampaignPromotionSection">
              <PermissionGuard permission="promotions:view">
                <CampaignPromotionSection campaign={campaign} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(campaign)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="CampaignConfigurationSection">
              <CampaignConfigurationSection campaign={campaign} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CampaignBudget">
              <CampaignBudget campaign={campaign} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  )
}
