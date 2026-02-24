import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

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
      {Children.count(children) > 0 ? children : <CategoryListTable />}
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
