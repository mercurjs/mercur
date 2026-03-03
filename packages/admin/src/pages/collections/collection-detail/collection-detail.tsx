import { ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useCollection } from "../../../hooks/api/collections"
import { hasExplicitCompoundComposition } from "../../../lib/compound-composition"
import { CollectionGeneralSection } from "./components/collection-general-section"
import { CollectionProductSection } from "./components/collection-product-section"
import { collectionLoader } from "./loader"

const ALLOWED_TYPES = [
  CollectionGeneralSection,
  CollectionProductSection,
] as const

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

  return hasExplicitCompoundComposition(children, ALLOWED_TYPES) ? (
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
