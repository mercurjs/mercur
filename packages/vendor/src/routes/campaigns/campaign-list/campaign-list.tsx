import { SingleColumnPage } from "../../../components/layout/pages"

import { CampaignListTable } from "./components/campaign-list-table"

export const CampaignList = () => {

  return (
    <SingleColumnPage
      hasOutlet
    >
      <CampaignListTable />
    </SingleColumnPage>
  )
}
