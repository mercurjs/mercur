import { SingleColumnPage } from "@components/layout/pages";
import { RegionListTable } from "./_components/region-list-table";

const RegionList = () => {
  return (
    <SingleColumnPage>
      <RegionListTable />
    </SingleColumnPage>
  );
};

export const Component = RegionList;
