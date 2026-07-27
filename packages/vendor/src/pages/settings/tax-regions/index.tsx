import { WidgetZone } from "@mercurjs/dashboard-shared";

import { SingleColumnPage } from "@components/layout/pages";
import { TaxRegionListView } from "./_components/tax-region-list-view";

const TaxRegionsList = () => {
  return (
    <SingleColumnPage hasOutlet>
      <WidgetZone id="tax-regions.list">
        <TaxRegionListView />
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const Component = TaxRegionsList;
