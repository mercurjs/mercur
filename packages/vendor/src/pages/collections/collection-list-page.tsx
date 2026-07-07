import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  CollectionListTable,
  CollectionListDataTable,
  CollectionListHeader,
  CollectionListActions,
  CollectionListTitle,
} from "./_components/collection-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="collections.list">
        {Children.count(children) > 0 ? children : <CollectionListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const CollectionListPage = Object.assign(Root, {
  Table: CollectionListTable,
  Header: CollectionListHeader,
  HeaderTitle: CollectionListTitle,
  HeaderActions: CollectionListActions,
  DataTable: CollectionListDataTable,
});
