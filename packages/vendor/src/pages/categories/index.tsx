import { SingleColumnPage } from "@components/layout/pages";
import { CategoryListTable } from "./_components/category-list-table";

export const Component = () => {
  return (
    <SingleColumnPage hasOutlet>
      <CategoryListTable />
    </SingleColumnPage>
  );
};
