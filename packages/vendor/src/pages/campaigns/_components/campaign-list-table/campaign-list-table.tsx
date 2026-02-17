import { Children, ReactNode } from "react";
import { Container } from "@medusajs/ui";

import { CampaignListHeader } from "./campaign-list-header";
import { CampaignListDataTable } from "./campaign-list-data-table";

export const CampaignListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CampaignListHeader />
          <CampaignListDataTable />
        </>
      )}
    </Container>
  );
};
