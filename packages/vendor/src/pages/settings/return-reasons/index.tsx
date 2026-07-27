import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "@components/layout/pages";
import { ReturnReasonListTable } from "./_components/return-reason-list-table";

const ReturnReasonList = () => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <WidgetZone id="return-reasons.list">
        <ReturnReasonListTable />
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const Component = ReturnReasonList;
