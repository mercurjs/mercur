import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils"

import { AdminGetInventoryItemsParamsType } from "./validators"
import { filterInventoryItemsBySeller, InventoryItemFilters } from "./utils"

export const GET = async (
    req: AuthenticatedMedusaRequest<AdminGetInventoryItemsParamsType>,
    res: MedusaResponse
) => {
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const skip = req.queryConfig.pagination?.skip ?? 0
    const take = req.queryConfig.pagination?.take ?? 20

    const { inventoryItemIds, count } = await filterInventoryItemsBySeller(
        req.scope,
        skip,
        take,
        req.filterableFields as InventoryItemFilters
    )

    if (inventoryItemIds.length === 0) {
        return res.status(200).json({
            inventory_items: [],
            count: 0,
            offset: skip,
            limit: take,
        })
    }

    const query = remoteQueryObjectFromString({
        entryPoint: "inventory_items",
        variables: {
            filters: {
                id: inventoryItemIds
            }
        },
        fields: req.queryConfig.fields,
    })

    const inventory_items = await remoteQuery({
        ...query,
    })

    res.status(200).json({
        inventory_items,
        count,
        offset: skip,
        limit: take,
    })
}
