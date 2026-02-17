import { LoaderFunctionArgs } from "react-router-dom";

import { productsQueryKeys } from "@hooks/api/products";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const customerDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/customers/${id}`, {
      method: "GET",
      query: { fields: "*groups, *groups.customers" },
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = customerDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};
