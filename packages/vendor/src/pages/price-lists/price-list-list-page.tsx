import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  PriceListListTable,
  PriceListListDataTable,
  PriceListListHeader,
  PriceListListActions,
  PriceListListTitle,
  PriceListListCreateButton,
} from "./_components/price-list-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="price-lists.list">
        {Children.count(children) > 0 ? children : <PriceListListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const PriceListListPage = Object.assign(Root, {
  Table: PriceListListTable,
  Header: PriceListListHeader,
  HeaderTitle: PriceListListTitle,
  HeaderActions: PriceListListActions,
  HeaderCreateButton: PriceListListCreateButton,
  DataTable: PriceListListDataTable,
});
