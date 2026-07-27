import { ReactNode, Children } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { SingleColumnPage } from "../../../components/layout/pages"
import { useCollection } from "../../../hooks/api/collections"
import { CollectionGeneralSection } from "./components/collection-general-section"
import { CollectionIconSection } from "./components/collection-icon-section"
import { CollectionMediaSection } from "./components/collection-media-section"
import { CollectionProductSection } from "./components/collection-product-section"
import { collectionLoader } from "./loader"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof collectionLoader>
  >;

  const { id } = useParams();
  const { collection, isLoading, isError, error } = useCollection(
    id!,
    useLinkQuery("collection"),
    {
      initialData,
    },
  );

  if (isLoading || !collection) {
    return <SingleColumnPageSkeleton sections={4} showJSON showMetadata />;
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
      <WidgetZone id="collections.detail.main" data={collection}>
        <CollectionGeneralSection collection={collection} />
        <CollectionMediaSection collection={collection} />
        <CollectionIconSection collection={collection} />
        <CollectionProductSection collection={collection} />
      </WidgetZone>
    </SingleColumnPage>
  );
};

export const CollectionDetailPage = Object.assign(Root, {
  GeneralSection: CollectionGeneralSection,
  MediaSection: CollectionMediaSection,
  IconSection: CollectionIconSection,
  ProductSection: CollectionProductSection,
});
