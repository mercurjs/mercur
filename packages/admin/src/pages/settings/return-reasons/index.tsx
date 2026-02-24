import { SingleColumnPage } from "@components/layout/pages";
import { ReturnReasonListTable } from "./_components/return-reason-list-table";

const ReturnReasonList = () => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <ReturnReasonListTable />
    </SingleColumnPage>
  );
};

export const Component = ReturnReasonList;
