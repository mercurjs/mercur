import { LoaderFunctionArgs } from "react-router-dom"

import { returnRequestsQueryKeys } from "../../../hooks/api/return-requests"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const returnRequestDetailQuery = (id: string) => ({
  queryKey: returnRequestsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.returnRequests.$id.query({ $id: id }),
})

export const returnRequestLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = returnRequestDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
