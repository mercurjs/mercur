import { LoaderFunctionArgs } from "react-router-dom"

import { productAttributesQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"
import { ATTRIBUTE_DETAIL_FIELDS } from "./constants"

const attributeDetailQuery = (id: string) => ({
  queryKey: productAttributesQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.productAttributes.$id.query({ $id: id, fields: ATTRIBUTE_DETAIL_FIELDS }),
})

export const attributeDetailLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = attributeDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
