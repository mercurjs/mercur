import { LoaderFunctionArgs } from "react-router-dom"
import { customerGroupsQueryKeys } from "@hooks/api/customer-groups"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants"

const customerGroupDetailQuery = (id: string) => ({
  queryKey: customerGroupsQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.customerGroup.retrieve(id, {
      fields: CUSTOMER_GROUP_DETAIL_FIELDS,
    }),
})

export const customerGroupLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = customerGroupDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
