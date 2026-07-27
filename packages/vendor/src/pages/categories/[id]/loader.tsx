import { getLinkQuery } from "@mercurjs/dashboard-shared";
import { LoaderFunctionArgs } from "react-router-dom";

import { categoriesQueryKeys } from "@hooks/api/categories";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const categoryDetailQuery = (id: string) => {
  const query = getLinkQuery("category");

  return {
    queryKey: categoriesQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/product-categories/${id}`, {
        method: "GET",
        query,
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = categoryDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
