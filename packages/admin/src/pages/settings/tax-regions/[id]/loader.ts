import { LoaderFunctionArgs } from "react-router-dom"
import { taxRegionsQueryKeys } from "@hooks/api/tax-regions"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

const taxRegionDetailQuery = (id: string) => ({
  queryKey: taxRegionsQueryKeys.detail(id),
  queryFn: async () => fetchQuery(`/vendor/tax-regions/${id}`, { method: "GET" }),
})

export const taxRegionLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = taxRegionDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
