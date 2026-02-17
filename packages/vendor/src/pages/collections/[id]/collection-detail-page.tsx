import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useCollection } from "@hooks/api/collections";

import { CollectionGeneralSection } from "./_components/collection-general-section";
import { CollectionProductSection } from "./_components/collection-product-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { collection, isLoading, isError, error } = useCollection(id!, {
    initialData,
  });

  if (isLoading || !collection) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) throw error;

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SingleColumnPage data={collection}>
          <CollectionGeneralSection collection={collection} />
          <CollectionProductSection collection={collection} />
        </SingleColumnPage>
      )}
    </>
  );
};

export const CollectionDetailPage = Object.assign(Root, {
  GeneralSection: CollectionGeneralSection,
  ProductSection: CollectionProductSection,
});
