import { LoaderFunctionArgs } from "react-router-dom";

import { ordersQueryKeys } from "@hooks/api/orders";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { DEFAULT_FIELDS } from "./constants";

const orderDetailQuery = (id: string) => ({
  queryKey: ordersQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/orders/${id}`, {
      method: "GET",
      query: { fields: DEFAULT_FIELDS },
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = orderDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
