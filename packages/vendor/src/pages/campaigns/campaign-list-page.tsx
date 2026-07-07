import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  CampaignListTable,
  CampaignListDataTable,
  CampaignListHeader,
  CampaignListActions,
  CampaignListTitle,
  CampaignListCreateButton,
} from "./_components/campaign-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="campaigns.list">
        {Children.count(children) > 0 ? children : <CampaignListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const CampaignListPage = Object.assign(Root, {
  Table: CampaignListTable,
  Header: CampaignListHeader,
  HeaderTitle: CampaignListTitle,
  HeaderActions: CampaignListActions,
  HeaderCreateButton: CampaignListCreateButton,
  DataTable: CampaignListDataTable,
});
