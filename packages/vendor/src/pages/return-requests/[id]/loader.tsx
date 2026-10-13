import { LoaderFunctionArgs } from "react-router-dom";

import { returnRequestsQueryKeys } from "@hooks/api/return-requests";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const returnRequestDetailQuery = (id: string) => ({
  queryKey: returnRequestsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/return-requests/${id}`, {
      method: "GET",
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = returnRequestDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
