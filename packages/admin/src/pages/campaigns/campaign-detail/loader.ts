import { LoaderFunctionArgs } from "react-router-dom"
import { getLinkQuery } from "@mercurjs/dashboard-shared"

import { campaignsQueryKeys } from "../../../hooks/api/campaigns"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { CAMPAIGN_DETAIL_FIELDS } from "./constants"

const campaignDetailQuery = (id: string) => {
  const query = getLinkQuery("campaign", CAMPAIGN_DETAIL_FIELDS)
  return {
    queryKey: campaignsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.campaigns.$id.query({ $id: id, ...query }),
  }
}

export const campaignLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = campaignDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
