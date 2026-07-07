import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

import {
  ProductListTable,
  ProductListDataTable,
  ProductListHeader,
  ProductListActions,
  ProductListTitle,
  ProductListCreateButton,
} from "./_components/product-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="product.list">
        {Children.count(children) > 0 ? children : <ProductListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const ProductListPage = Object.assign(Root, {
  Table: ProductListTable,
  Header: ProductListHeader,
  HeaderTitle: ProductListTitle,
  HeaderActions: ProductListActions,
  HeaderCreateButton: ProductListCreateButton,
  DataTable: ProductListDataTable,
});
