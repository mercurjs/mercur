import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useCollection } from "../../../hooks/api/collections"
import { CollectionGeneralSection } from "./components/collection-general-section"
import { CollectionProductSection } from "./components/collection-product-section"
import { collectionLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof collectionLoader>
  >;

  const { id } = useParams();
  const { collection, isLoading, isError, error } = useCollection(
    id!,
    {},
    {
      initialData,
    },
  );

  if (isLoading || !collection) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage showJSON showMetadata data={collection}>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={collection}>
      <CollectionGeneralSection collection={collection} />
      <CollectionProductSection collection={collection} />
    </SingleColumnPage>
  );
};

export const CollectionDetail = Object.assign(Root, {
  GeneralSection: CollectionGeneralSection,
  ProductSection: CollectionProductSection,
});
