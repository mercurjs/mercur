// Route: /campaigns
import { SingleColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { CampaignListTable } from "./_components/campaign-list-table"

export const Component = () => {
  const { getWidgets } = useDashboardExtension()

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("campaign.list.after"),
        before: getWidgets("campaign.list.before"),
      }}
      hasOutlet
    >
      <CampaignListTable />
    </SingleColumnPage>
  )
}
