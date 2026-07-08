import { LoaderFunctionArgs } from "react-router-dom";

import { getLinkQuery } from "@mercurjs/dashboard-shared";

import { inventoryItemsQueryKeys } from "@hooks/api/inventory";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { INVENTORY_DETAIL_FIELDS } from "./constants";

const inventoryDetailQuery = (id: string) => {
  const query = getLinkQuery("inventory_item", INVENTORY_DETAIL_FIELDS);
  return {
    queryKey: inventoryItemsQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(
        `/vendor/inventory-items/${id}?fields=${query.fields}`,
        { method: "GET" },
      ),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = inventoryDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};
