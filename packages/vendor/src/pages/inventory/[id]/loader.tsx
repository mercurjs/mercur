import { LoaderFunctionArgs } from "react-router-dom";

import { inventoryItemsQueryKeys } from "@hooks/api/inventory";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { INVENTORY_DETAIL_FIELDS } from "./constants";

const inventoryDetailQuery = (id: string) => ({
  queryKey: inventoryItemsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(
      `/vendor/inventory-items/${id}?fields=${INVENTORY_DETAIL_FIELDS}`,
      { method: "GET" },
    ),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = inventoryDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};
