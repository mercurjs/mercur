import { LoaderFunctionArgs } from "react-router-dom";

import { priceListsQueryKeys } from "@hooks/api/price-lists";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

const pricingDetailQuery = (id: string) => ({
  queryKey: priceListsQueryKeys.detail(id),
  queryFn: async () =>
    await fetchQuery(`/vendor/price-lists/${id}`, {
      method: "GET",
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = pricingDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
