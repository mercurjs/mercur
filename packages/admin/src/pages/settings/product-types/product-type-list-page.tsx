import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  ProductTypeListTable,
  ProductTypeListDataTable,
  ProductTypeListHeader,
  ProductTypeListActions,
  ProductTypeListTitle,
} from "./_components";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ProductTypeListTable />}
    </SingleColumnPage>
  );
};

export const ProductTypeListPage = Object.assign(Root, {
  Table: ProductTypeListTable,
  Header: ProductTypeListHeader,
  HeaderTitle: ProductTypeListTitle,
  HeaderActions: ProductTypeListActions,
  DataTable: ProductTypeListDataTable,
});
