import { SingleColumnPage } from "@components/layout/pages";
import { TaxRegionListView } from "./_components/tax-region-list-view";

const TaxRegionsList = () => {
  return (
    <SingleColumnPage hasOutlet>
      <TaxRegionListView />
    </SingleColumnPage>
  );
};

export const Component = TaxRegionsList;
