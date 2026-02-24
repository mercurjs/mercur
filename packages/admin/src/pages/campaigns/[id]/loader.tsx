import { LoaderFunctionArgs } from "react-router-dom";

import { campaignsQueryKeys } from "@hooks/api/campaigns";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { CAMPAIGN_DETAIL_FIELDS } from "./constants";

const campaignDetailQuery = (id: string) => ({
  queryKey: campaignsQueryKeys.detail(id, { fields: CAMPAIGN_DETAIL_FIELDS }),
  queryFn: async () =>
    fetchQuery(`/vendor/campaigns/${id}`, {
      method: "GET",
      query: {
        fields: CAMPAIGN_DETAIL_FIELDS,
      },
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = campaignDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
