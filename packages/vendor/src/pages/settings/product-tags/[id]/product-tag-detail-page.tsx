import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useProductTag } from "@hooks/api";

import { ProductTagGeneralSection } from "./_components/product-tag-general-section";
import { ProductTagProductSection } from "./_components/product-tag-product-section";

import type { productTagLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();

  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof productTagLoader>
  >;

  const { product_tag, isPending, isError, error } = useProductTag(
    id!,
    undefined,
    {
      initialData,
    },
  );

  if (isPending || !product_tag) {
    return <SingleColumnPageSkeleton showJSON sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={product_tag}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <ProductTagGeneralSection productTag={product_tag} />
          <ProductTagProductSection productTag={product_tag} />
        </>
      )}
    </SingleColumnPage>
  );
};

export const ProductTagDetailPage = Object.assign(Root, {
  GeneralSection: ProductTagGeneralSection,
  ProductSection: ProductTagProductSection,
});
