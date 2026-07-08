import { getLinkQuery } from "@mercurjs/dashboard-shared";
import { LoaderFunctionArgs } from "react-router-dom";

import { ordersQueryKeys } from "@hooks/api/orders";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { DEFAULT_FIELDS } from "./constants";

const orderDetailQuery = (id: string) => {
  const { fields } = getLinkQuery("order", DEFAULT_FIELDS);
  return {
    queryKey: ordersQueryKeys.detail(id, { fields }),
    queryFn: async () =>
      fetchQuery(`/vendor/orders/${id}`, {
        method: "GET",
        query: { fields },
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = orderDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
