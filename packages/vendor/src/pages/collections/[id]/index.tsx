// Route: /collections/:id
import { HttpTypes } from "@medusajs/types";
import {
  UIMatch,
  useLoaderData,
  useParams,
  LoaderFunctionArgs,
} from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useDashboardExtension } from "@/extensions";
import { useCollection } from "@hooks/api/collections";
import { collectionsQueryKeys } from "@hooks/api/collections";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { CollectionGeneralSection } from "./_components/collection-general-section";
import { CollectionProductSection } from "./_components/collection-product-section";

// Loader
const collectionDetailQuery = (id: string) => ({
  queryKey: collectionsQueryKeys.detail(id),
  queryFn: async () => sdk.vendor.collections.$id.query({ $id: id }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = collectionDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};

// Breadcrumb
type CollectionDetailBreadcrumbProps =
  UIMatch<HttpTypes.AdminCollectionResponse>;

export const Breadcrumb = (props: CollectionDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  const { product_collection } = useCollection(id!, {
    initialData: { product_collection: props.data?.collection },
  });

  if (!product_collection) return null;
  return <span>{product_collection.title}</span>;
};

// Main component
export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { product_collection, isLoading, isError, error } = useCollection(id!, {
    initialData,
  });
  const { getWidgets } = useDashboardExtension();

  if (isLoading || !product_collection) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) throw error;

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product_collection.details.after"),
        before: getWidgets("product_collection.details.before"),
      }}
      data={product_collection}
    >
      <CollectionGeneralSection collection={product_collection} />
      <CollectionProductSection collection={product_collection} />
    </SingleColumnPage>
  );
};
