import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  InventoryListTable,
  InventoryListDataTable,
  InventoryListHeader,
  InventoryListCreateButton,
} from "./_components";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="inventory.list">
        {Children.count(children) > 0 ? children : <InventoryListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const InventoryListPage = Object.assign(Root, {
  Table: InventoryListTable,
  Header: InventoryListHeader,
  HeaderCreateButton: InventoryListCreateButton,
  DataTable: InventoryListDataTable,
});
