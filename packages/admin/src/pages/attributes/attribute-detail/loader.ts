import { LoaderFunctionArgs } from "react-router-dom"

import { attributesQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { ATTRIBUTE_DETAIL_FIELDS } from "./constants"

const attributeDetailQuery = (id: string) => ({
  queryKey: attributesQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.attributes.$id.query({ $id: id, fields: ATTRIBUTE_DETAIL_FIELDS }),
})

export const attributeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = attributeDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
