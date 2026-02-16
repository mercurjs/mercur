import { SingleColumnPage } from "@components/layout/pages";
import { ProductTagListTable } from "./_components/product-tag-list-table";

const ProductTagList = () => {
  return (
    <SingleColumnPage showMetadata={false} showJSON={false} hasOutlet>
      <ProductTagListTable />
    </SingleColumnPage>
  );
};

export const Component = ProductTagList;
