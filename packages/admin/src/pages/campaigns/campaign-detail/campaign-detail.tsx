import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared"
import { useCampaign } from "../../../hooks/api/campaigns"
import { CampaignBudget } from "./components/campaign-budget"
import { CampaignConfigurationSection } from "./components/campaign-configuration-section"
import { CampaignGeneralSection } from "./components/campaign-general-section"
import { CampaignPromotionSection } from "./components/campaign-promotion-section"
import { campaignLoader } from "./loader"
import { CAMPAIGN_DETAIL_FIELDS } from "./constants"

const Root = ({ children }: { children?: ReactNode }) => {
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

  return Children.count(children) > 0 ? (
    <TwoColumnPage hasOutlet showJSON showMetadata data={campaign} data-testid="campaign-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage hasOutlet showJSON showMetadata data={campaign} data-testid="campaign-detail-page">
      <TwoColumnPage.Main>
        <WidgetZone id="campaigns.detail.main" data={campaign}>
          <CampaignGeneralSection campaign={campaign} />
          <CampaignPromotionSection campaign={campaign} />
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="campaigns.detail.side" data={campaign}>
          <CampaignConfigurationSection campaign={campaign} />
          <CampaignBudget campaign={campaign} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const CampaignDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CampaignGeneralSection,
  MainPromotionSection: CampaignPromotionSection,
  SidebarConfigurationSection: CampaignConfigurationSection,
  SidebarBudgetSection: CampaignBudget,
})
