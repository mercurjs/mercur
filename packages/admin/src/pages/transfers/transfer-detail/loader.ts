import { LoaderFunctionArgs } from "react-router-dom"

import { transfersQueryKeys } from "../../../hooks/api/transfers"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const transferDetailQuery = (id: string) => ({
  queryKey: transfersQueryKeys.detail(id),
  queryFn: async () => sdk.admin.transfers.$id.query({ $id: id }),
})

export const transferLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = transferDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
