import { LoaderFunctionArgs } from "react-router-dom";

import { promotionsQueryKeys } from "@hooks/api/promotions";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const promotionDetailQuery = (id: string) => ({
  queryKey: promotionsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/promotions/${id}`, {
      method: "GET",
      query: { fields: "+status" },
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  return queryClient.ensureQueryData(promotionDetailQuery(id!));
};
