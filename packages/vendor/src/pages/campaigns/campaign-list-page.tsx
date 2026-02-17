import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

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
      {Children.count(children) > 0 ? children : <CampaignListTable />}
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
