// Route: /campaigns
import { SingleColumnPage } from "@components/layout/pages";
import { CampaignListTable } from "./_components/campaign-list-table";

export const Component = () => {
  return (
    <SingleColumnPage hasOutlet>
      <CampaignListTable />
    </SingleColumnPage>
  );
};
