import { ReactNode, Children } from "react";

import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "../../../components/layout/pages";
import {
  ProductListTable,
  ProductListHeader,
  ProductListTitle,
  ProductListActions,
  ProductListCreateButton,
  ProductListDataTable,
} from "./components/product-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div data-testid="products-page">
      <SingleColumnPage>
        <WidgetZone id="products.list">
          {Children.count(children) > 0 ? children : <ProductListTable />}
        </WidgetZone>
      </SingleColumnPage>
    </div>
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
