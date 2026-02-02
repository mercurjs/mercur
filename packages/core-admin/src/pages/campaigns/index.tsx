import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { CampaignListTable } from "./_components/campaign-list-table"

const CampaignList = () => {
  const { getWidgets } = useExtension()

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

export const Component = CampaignList
