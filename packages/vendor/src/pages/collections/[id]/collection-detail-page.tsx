import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useCollection } from "@hooks/api/collections";

import { CollectionGeneralSection } from "./_components/collection-general-section";
import { CollectionIconSection } from "./_components/collection-icon-section";
import { CollectionMediaSection } from "./_components/collection-media-section";
import { CollectionProductSection } from "./_components/collection-product-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { collection, isLoading, isError, error } = useCollection(
    id!,
    useLinkQuery("collection"),
    {
      initialData,
    },
  );

  if (isLoading || !collection) {
    return <SingleColumnPageSkeleton sections={4} />;
  }

  if (isError) throw error;

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SingleColumnPage data={collection}>
          <WidgetZone id="collections.detail.main" data={collection}>
            <CollectionGeneralSection collection={collection} />
            <CollectionMediaSection collection={collection} />
            <CollectionIconSection collection={collection} />
            <CollectionProductSection collection={collection} />
          </WidgetZone>
        </SingleColumnPage>
      )}
    </>
  );
};

export const CollectionDetailPage = Object.assign(Root, {
  GeneralSection: CollectionGeneralSection,
  MediaSection: CollectionMediaSection,
  IconSection: CollectionIconSection,
  ProductSection: CollectionProductSection,
});
