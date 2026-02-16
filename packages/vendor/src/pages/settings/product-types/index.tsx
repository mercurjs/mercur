import { SingleColumnPage } from "@components/layout/pages";
import { ProductTypeListTable } from "./_components/product-type-list-table";

const ProductTypeList = () => {
  return (
    <SingleColumnPage>
      <ProductTypeListTable />
    </SingleColumnPage>
  );
};

export const Component = ProductTypeList;
