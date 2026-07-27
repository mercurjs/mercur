import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "@components/layout/pages";
import { RegionListTable } from "./_components/region-list-table";

const RegionList = () => {
  return (
    <SingleColumnPage>
      <WidgetZone id="regions.list">
        <RegionListTable />
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const Component = RegionList;
