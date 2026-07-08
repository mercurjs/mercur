import { LoaderFunctionArgs } from "react-router-dom";

import { getLinkQuery } from "@mercurjs/dashboard-shared";
import { customersQueryKeys } from "@hooks/api/customers";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const customerDetailQuery = (id: string) => {
  const query = getLinkQuery("customer", "*groups, *groups.customers");
  return {
    queryKey: customersQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/customers/${id}`, {
        method: "GET",
        query,
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = customerDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};
