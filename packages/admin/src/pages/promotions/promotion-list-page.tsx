import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  PromotionListTable,
  PromotionListDataTable,
  PromotionListHeader,
  PromotionListActions,
  PromotionListTitle,
  PromotionListCreateButton,
} from "./_components/promotion-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      {Children.count(children) > 0 ? children : <PromotionListTable />}
    </SingleColumnPage>
  );
};

export const PromotionListPage = Object.assign(Root, {
  Table: PromotionListTable,
  Header: PromotionListHeader,
  HeaderTitle: PromotionListTitle,
  HeaderActions: PromotionListActions,
  HeaderCreateButton: PromotionListCreateButton,
  DataTable: PromotionListDataTable,
});
