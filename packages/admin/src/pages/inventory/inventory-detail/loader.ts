import type { LoaderFunctionArgs } from "react-router-dom"
import { getLinkQuery } from "@mercurjs/dashboard-shared"
import { INVENTORY_DETAIL_FIELDS } from "./constants"
import { inventoryItemsQueryKeys } from "@hooks/api"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"
import type { ExtendedAdminInventoryItemResponse } from "@custom-types/inventory"

const inventoryDetailQuery = (id: string) => {
  const query = getLinkQuery("inventory_item", INVENTORY_DETAIL_FIELDS)
  return {
    queryKey: inventoryItemsQueryKeys.detail(id, query),
    queryFn: async () =>
      sdk.admin.inventoryItems.$id.query({
        $id: id,
        ...query,
      }) as Promise<ExtendedAdminInventoryItemResponse>,
  }
}

export const inventoryItemLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = inventoryDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
