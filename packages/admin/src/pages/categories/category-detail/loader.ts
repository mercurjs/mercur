import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { LoaderFunctionArgs } from "react-router-dom"

import { categoriesQueryKeys } from "../../../hooks/api/categories"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const categoryDetailQuery = (id: string) => {
  const query = getLinkQuery("category")

  return {
    queryKey: categoriesQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.productCategories.$id.query({ $id: id, ...query }),
  }
}

export const categoryLoader = async ({ params }: LoaderFunctionArgs): Promise<any> => {
  const id = params.id
  const query = categoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
