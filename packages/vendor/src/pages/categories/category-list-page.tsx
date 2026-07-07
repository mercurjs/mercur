import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  CategoryListTable,
  CategoryListDataTable,
  CategoryListHeader,
  CategoryListActions,
  CategoryListTitle,
} from "./_components/category-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="categories.list">
        {Children.count(children) > 0 ? children : <CategoryListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const CategoryListPage = Object.assign(Root, {
  Table: CategoryListTable,
  Header: CategoryListHeader,
  HeaderTitle: CategoryListTitle,
  HeaderActions: CategoryListActions,
  DataTable: CategoryListDataTable,
});
