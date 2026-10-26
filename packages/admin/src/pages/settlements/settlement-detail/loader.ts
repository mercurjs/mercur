import { LoaderFunctionArgs } from "react-router-dom"

import { settlementsQueryKeys } from "../../../hooks/api/settlements"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const settlementDetailQuery = (id: string) => ({
  queryKey: settlementsQueryKeys.detail(id),
  queryFn: async () => sdk.admin.settlements.$id.query({ $id: id }),
})

export const settlementLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = settlementDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
