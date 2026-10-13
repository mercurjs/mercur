import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@mercurjs/dashboard-shared";

import {
  ReturnRequestListDataTable,
  ReturnRequestListHeader,
  ReturnRequestListTable,
} from "./_components/return-request-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ReturnRequestListTable />}
    </SingleColumnPage>
  );
};

export const ReturnRequestListPage = Object.assign(Root, {
  Table: ReturnRequestListTable,
  Header: ReturnRequestListHeader,
  DataTable: ReturnRequestListDataTable,
});
