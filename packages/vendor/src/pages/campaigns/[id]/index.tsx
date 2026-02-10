// Route: /campaigns/:id
import { useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { UIMatch } from "react-router-dom"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { useCampaign, campaignsQueryKeys } from "@hooks/api/campaigns"
import { usePromotionTableQuery } from "@hooks/table/query/use-promotion-table-query"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { CampaignBudget } from "./_components/campaign-budget"
import { CampaignConfigurationSection } from "./_components/campaign-configuration-section"
import { CampaignGeneralSection } from "./_components/campaign-general-section"
import { CampaignPromotionSection } from "./_components/campaign-promotion-section"
import { CampaignSpend } from "./_components/campaign-spend"
import { CAMPAIGN_DETAIL_FIELDS } from "./constants"

const campaignDetailQuery = (id: string) => ({
  queryKey: campaignsQueryKeys.detail(id, { fields: CAMPAIGN_DETAIL_FIELDS }),
  queryFn: async () =>
    fetchQuery(`/vendor/campaigns/${id}`, {
      method: "GET",
      query: {
        fields: CAMPAIGN_DETAIL_FIELDS,
      },
    }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = campaignDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}

type CampaignDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCampaignResponse>

export const Breadcrumb = (props: CampaignDetailBreadcrumbProps) => {
  const { id } = props.params || {}

  const { campaign } = useCampaign(
    id!,
    {
      fields: CAMPAIGN_DETAIL_FIELDS,
    },
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!campaign) {
    return null
  }

  return <span>{campaign.name}</span>
}

export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>

  const { id } = useParams()
  const { searchParams } = usePromotionTableQuery({})
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    { ...searchParams, fields: CAMPAIGN_DETAIL_FIELDS },
    {
      placeholderData: initialData,
    }
  )

  const { getWidgets } = useDashboardExtension()

  if (isLoading || !campaign) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={3} />
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
