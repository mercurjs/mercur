import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import { CampaignListTable } from "./components/campaign-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <CampaignListTable />}
    </SingleColumnPage>
  )
}

export const CampaignList = Object.assign(Root, {
  Table: CampaignListTable,
})
