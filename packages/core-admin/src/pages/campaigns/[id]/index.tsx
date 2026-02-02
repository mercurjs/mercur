import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useCampaign } from "@hooks/api/campaigns"
import { useExtension } from "@providers/extension-provider"

import { CAMPAIGN_DETAIL_FIELDS } from "../_common/constants"
import { CampaignBudget } from "./_components/campaign-budget"
import { CampaignConfigurationSection } from "./_components/campaign-configuration-section"
import { CampaignGeneralSection } from "./_components/campaign-general-section"
import { CampaignPromotionSection } from "./_components/campaign-promotion-section"
import { CampaignSpend } from "./_components/campaign-spend"
import { campaignLoader } from "./loader"

const CampaignDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof campaignLoader>
  >

  const { id } = useParams()
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    { fields: CAMPAIGN_DETAIL_FIELDS },
    { initialData }
  )

  const { getWidgets } = useExtension()

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

  return (
    <TwoColumnPage
      widgets={{
        after: getWidgets("campaign.details.after"),
        before: getWidgets("campaign.details.before"),
        sideAfter: getWidgets("campaign.details.side.after"),
        sideBefore: getWidgets("campaign.details.side.before"),
      }}
      hasOutlet
      showJSON
      showMetadata
      data={campaign}
    >
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

export const Component = CampaignDetail
export { campaignLoader as loader } from "./loader"
export { CampaignDetailBreadcrumb as Breadcrumb } from "./breadcrumb"
