import { getLinkQuery } from "@mercurjs/dashboard-shared";
import { LoaderFunctionArgs } from "react-router-dom";

import { promotionsQueryKeys } from "@hooks/api/promotions";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const promotionDetailQuery = (id: string) => {
  const query = getLinkQuery("promotion", "+status");
  return {
    queryKey: promotionsQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/promotions/${id}`, {
        method: "GET",
        query,
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  return queryClient.ensureQueryData(promotionDetailQuery(id!));
};
