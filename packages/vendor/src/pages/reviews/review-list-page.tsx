import { Children, ReactNode } from "react";

import { SingleColumnPage } from "@mercurjs/dashboard-shared";

import {
  ReviewListTable,
  ReviewListHeader,
  ReviewListDataTable,
} from "./_components/review-list-table";

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <ReviewListTable />}
    </SingleColumnPage>
  );
};

export const ReviewListPage = Object.assign(Root, {
  Table: ReviewListTable,
  Header: ReviewListHeader,
  DataTable: ReviewListDataTable,
});
