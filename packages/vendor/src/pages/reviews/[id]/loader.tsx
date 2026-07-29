import { LoaderFunctionArgs } from "react-router-dom";

import { reviewsQueryKeys } from "@hooks/api/reviews";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const reviewDetailQuery = (id: string) => ({
  queryKey: reviewsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/reviews/${id}`, {
      method: "GET",
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = reviewDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
