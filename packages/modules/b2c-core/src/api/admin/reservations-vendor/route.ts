import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, remoteQueryObjectFromString } from "@medusajs/framework/utils"

import sellerInventoryItem from "../../../links/seller-inventory-item"
import { AdminGetReservationsParamsType } from "./validators"

export const GET = async (
    req: AuthenticatedMedusaRequest<AdminGetReservationsParamsType>,
    res: MedusaResponse
) => {
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

    const { seller, ...otherFilters } = req.filterableFields as Record<string, unknown> & {
        seller?: { id?: string | string[] }
    }

    let inventoryItemIdFilter: string[] | undefined

    if (seller?.id) {
        const sellerItemsQuery = remoteQueryObjectFromString({
            entryPoint: sellerInventoryItem.entryPoint,
            fields: ['inventory_item_id'],
            variables: {
                filters: {
                    seller_id: seller.id
                }
            }
        })
        const sellerItems = await remoteQuery(sellerItemsQuery)
        const itemIds = sellerItems.map((item: { inventory_item_id: string }) => item.inventory_item_id)

        inventoryItemIdFilter = itemIds.length > 0 ? itemIds : undefined
    }

    const query = remoteQueryObjectFromString({
        entryPoint: "reservations",
        variables: {
            filters: {
                ...otherFilters,
                ...(inventoryItemIdFilter && { inventory_item_id: inventoryItemIdFilter })
            },
            ...req.queryConfig.pagination,
        },
        fields: req.queryConfig.fields,
    })

    const { rows: reservations, metadata } = await remoteQuery({
        ...query,
    })

    res.status(200).json({
        reservations,
        count: metadata?.count,
        offset: metadata?.skip,
        limit: metadata?.take,
    })
}

