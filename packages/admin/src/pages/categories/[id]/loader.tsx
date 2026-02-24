import { LoaderFunctionArgs } from "react-router-dom";

import { categoriesQueryKeys } from "@hooks/api/categories";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const categoryDetailQuery = (id: string) => ({
  queryKey: categoriesQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/product-categories/${id}`, {
      method: "GET",
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = categoryDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
