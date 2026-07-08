import { LoaderFunctionArgs } from "react-router-dom";
import { getLinkQuery } from "@mercurjs/dashboard-shared";

import { campaignsQueryKeys } from "@hooks/api/campaigns";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { CAMPAIGN_DETAIL_FIELDS } from "./constants";

const campaignDetailQuery = (id: string) => {
  const query = getLinkQuery("campaign", CAMPAIGN_DETAIL_FIELDS);
  return {
    queryKey: campaignsQueryKeys.detail(id, query),
    queryFn: async () =>
      fetchQuery(`/vendor/campaigns/${id}`, {
        method: "GET",
        query,
      }),
  };
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = campaignDetailQuery(id!);

  return queryClient.ensureQueryData(query);
};
