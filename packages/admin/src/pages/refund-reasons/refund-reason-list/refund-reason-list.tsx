import { Children, ReactNode } from "react";

import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "../../../components/layout/pages";
import { RefundReasonListTable } from "./components/refund-reason-list-table";
import {
  RefundReasonListActions,
  RefundReasonListHeader,
  RefundReasonListTitle,
} from "./components/refund-reason-list-table/refund-reason-list-header";
import { RefundReasonListDataTable } from "./components/refund-reason-list-table/refund-reason-list-data-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <WidgetZone id="refund-reasons.list">
        {Children.count(children) > 0 ? children : <RefundReasonListTable />}
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const RefundReasonList = Object.assign(Root, {
  Table: RefundReasonListTable,
  Header: RefundReasonListHeader,
  HeaderTitle: RefundReasonListTitle,
  HeaderActions: RefundReasonListActions,
  DataTable: RefundReasonListDataTable,
});
