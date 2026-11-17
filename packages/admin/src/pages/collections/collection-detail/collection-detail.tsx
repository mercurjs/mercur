import { useLoaderData, useParams } from "react-router-dom"

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"
import {
  LayoutComposer,
  PermissionGuard,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared"

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { useCollection } from "../../../hooks/api/collections"
import { CollectionGeneralSection } from "./components/collection-general-section"
import { CollectionIconSection } from "./components/collection-icon-section"
import { CollectionMediaSection } from "./components/collection-media-section"
import { CollectionProductSection } from "./components/collection-product-section"
import { collectionLoader } from "./loader"

export const CollectionDetailPage = () => {
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

  return (
    <LayoutComposer
      widgetsZonePrefix="collections.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={collection}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CollectionGeneralSection">
              <CollectionGeneralSection collection={collection} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CollectionMediaSection">
              <CollectionMediaSection collection={collection} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CollectionIconSection">
              <CollectionIconSection collection={collection} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CollectionProductSection">
              <PermissionGuard permission="products:view">
                <CollectionProductSection collection={collection} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(collection)}
          </>
        ),
      }}
    />
  );
};
