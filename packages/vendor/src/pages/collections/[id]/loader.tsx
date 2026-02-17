import { LoaderFunctionArgs } from "react-router-dom";

import { collectionsQueryKeys } from "@hooks/api/collections";
import { sdk } from "@lib/client";
import { queryClient } from "@lib/query-client";

const collectionDetailQuery = (id: string) => ({
  queryKey: collectionsQueryKeys.detail(id),
  queryFn: async () => sdk.vendor.collections.$id.query({ $id: id }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = collectionDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};
