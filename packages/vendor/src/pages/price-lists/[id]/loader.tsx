import { LoaderFunctionArgs } from "react-router-dom";

import { getLinkQuery } from "@mercurjs/dashboard-shared";

import { priceListsQueryKeys } from "@hooks/api/price-lists";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const pricingDetailQuery = (id: string) => {
  const query = getLinkQuery("price_list");
  return {
    queryKey: priceListsQueryKeys.detail(id, query),
    queryFn: async () =>
      await fetchQuery(`/vendor/price-lists/${id}`, {
        method: "GET",
        query,
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = pricingDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
