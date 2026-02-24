import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  ProductTagListTable,
  ProductTagListDataTable,
  ProductTagListHeader,
  ProductTagListActions,
  ProductTagListTitle,
} from "./_components";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      {Children.count(children) > 0 ? children : <ProductTagListTable />}
    </SingleColumnPage>
  );
};

export const ProductTagListPage = Object.assign(Root, {
  Table: ProductTagListTable,
  Header: ProductTagListHeader,
  HeaderTitle: ProductTagListTitle,
  HeaderActions: ProductTagListActions,
  DataTable: ProductTagListDataTable,
});
