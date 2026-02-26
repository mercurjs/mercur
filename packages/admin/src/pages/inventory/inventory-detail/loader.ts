import type { LoaderFunctionArgs } from "react-router-dom"
import { INVENTORY_DETAIL_FIELDS } from "./constants"
import { inventoryItemsQueryKeys } from "@hooks/api"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"
import type { ExtendedAdminInventoryItemResponse } from "@custom-types/inventory"

const inventoryDetailQuery = (id: string) => ({
  queryKey: inventoryItemsQueryKeys.detail(id),
  queryFn: async () =>
    sdk.admin.inventoryItems.$id.query({
      $id: id,
      fields: INVENTORY_DETAIL_FIELDS,
    }) as Promise<ExtendedAdminInventoryItemResponse>,
})

export const inventoryItemLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = inventoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
