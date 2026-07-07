import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone } from "@mercurjs/dashboard-shared";

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
      <WidgetZone id="product-tags.list">
        {Children.count(children) > 0 ? children : <ProductTagListTable />}
      </WidgetZone>
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
