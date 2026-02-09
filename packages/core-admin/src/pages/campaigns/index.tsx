import { SingleColumnPage } from "@components/layout/pages"
import { useExtension } from "@providers/extension-provider"

import { CampaignListTable } from "./_components/campaign-list-table"

export const nav = {
  id: "campaigns",
  labelKey: "navigation.items.campaigns",
  parent: "promotions",
  order: 30,
}

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
