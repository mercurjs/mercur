import { Children, ReactNode } from "react"

import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  CampaignListTable,
  CampaignListHeader,
  CampaignListTitle,
  CampaignListActions,
  CampaignListCreateButton,
  CampaignListDataTable,
} from "./components/campaign-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="campaigns.list">
        {Children.count(children) > 0 ? children : <CampaignListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const CampaignListPage = Object.assign(Root, {
  Table: CampaignListTable,
  Header: CampaignListHeader,
  HeaderTitle: CampaignListTitle,
  HeaderActions: CampaignListActions,
  HeaderCreateButton: CampaignListCreateButton,
  DataTable: CampaignListDataTable,
})
