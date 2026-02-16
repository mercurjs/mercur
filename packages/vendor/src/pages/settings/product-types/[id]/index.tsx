import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useProductType } from "@hooks/api/product-types";
import { ProductTypeGeneralSection } from "./_components/product-type-general-section";
import { ProductTypeProductSection } from "./_components/product-type-product-section";
import { productTypeLoader } from "./loader";

const ProductTypeDetail = () => {
  const { id } = useParams();
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTypeLoader>
  >;

  const { product_type, isPending, isError, error } = useProductType(
    id!,
    undefined,
    {
      initialData,
    },
  );

  if (isPending || !product_type) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={product_type}>
      <ProductTypeGeneralSection productType={product_type} />
      <ProductTypeProductSection productType={product_type} />
    </SingleColumnPage>
  );
};

export const Component = ProductTypeDetail;
export { productTypeLoader as loader } from "./loader";
export { ProductTypeDetailBreadcrumb as Breadcrumb } from "./breadcrumb";
