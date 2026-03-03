import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { useCampaign } from "../../../hooks/api/campaigns"
import { CampaignBudget } from "./components/campaign-budget"
import { CampaignConfigurationSection } from "./components/campaign-configuration-section"
import { CampaignGeneralSection } from "./components/campaign-general-section"
import { CampaignPromotionSection } from "./components/campaign-promotion-section"
import { CampaignSpend } from "./components/campaign-spend"
import { campaignLoader } from "./loader"
import { CAMPAIGN_DETAIL_FIELDS } from "./constants"

const ALLOWED_TYPES = [TwoColumnPage.Main, TwoColumnPage.Sidebar, CampaignGeneralSection, CampaignPromotionSection, CampaignConfigurationSection, CampaignSpend, CampaignBudget] as const

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof campaignLoader>
  >

  const { id } = useParams()
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    { fields: CAMPAIGN_DETAIL_FIELDS },
    { initialData }
  )

  if (isLoading || !campaign) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={3}
        showJSON
        showMetadata
      />
    )
  }

  if (isError) {
    throw error
  }

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
    <TwoColumnPage hasOutlet showJSON showMetadata data={campaign} data-testid="campaign-detail-page">
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage hasOutlet showJSON showMetadata data={campaign} data-testid="campaign-detail-page">
      <TwoColumnPage.Main>
        <CampaignGeneralSection campaign={campaign} />
        <CampaignPromotionSection campaign={campaign} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <CampaignConfigurationSection campaign={campaign} />
        <CampaignSpend campaign={campaign} />
        <CampaignBudget campaign={campaign} />
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
  SidebarSpendSection: CampaignSpend,
  SidebarBudgetSection: CampaignBudget,
})
