import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

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
      <WidgetZone id="product-types.list">
        {Children.count(children) > 0 ? children : <ProductTypeListTable />}
      </WidgetZone>
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
