import { LoaderFunctionArgs } from "react-router-dom"

import { reviewsQueryKeys } from "../../../hooks/api/reviews"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { REVIEW_DETAIL_FIELDS } from "./constants"

const reviewDetailQuery = (id: string) => {
  const query = { fields: REVIEW_DETAIL_FIELDS }
  return {
    queryKey: reviewsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.reviews.$id.query({ $id: id, ...query }),
  }
}

export const reviewLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = reviewDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
