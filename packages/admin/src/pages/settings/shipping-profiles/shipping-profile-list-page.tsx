import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@components/layout/pages";

import {
  ShippingProfileListTable,
  ShippingProfileListDataTable,
  ShippingProfileListHeader,
  ShippingProfileListActions,
  ShippingProfileListTitle,
  ShippingProfileListCreateButton,
} from "./_components";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ShippingProfileListTable />}
    </SingleColumnPage>
  );
};

export const ShippingProfileListPage = Object.assign(Root, {
  Table: ShippingProfileListTable,
  Header: ShippingProfileListHeader,
  HeaderTitle: ShippingProfileListTitle,
  HeaderActions: ShippingProfileListActions,
  HeaderCreateButton: ShippingProfileListCreateButton,
  DataTable: ShippingProfileListDataTable,
});
