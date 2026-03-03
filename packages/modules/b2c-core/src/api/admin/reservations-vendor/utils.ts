import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export type ReservationFilters = {
    id?: string | string[]
    location_id?: string | string[]
    inventory_item_id?: string | string[]
    line_item_id?: string | string[]
    seller?: { id?: string | string[] }
}

export const filterReservationsBySeller = async (
    container: MedusaContainer,
    skip: number,
    take: number,
    filters?: ReservationFilters
) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    let baseQuery = knex('reservation')
        .distinct('reservation.id', 'reservation.created_at')
        .where('reservation.deleted_at', null)

    if (filters?.seller?.id) {
        const sellerIds = Array.isArray(filters.seller.id)
            ? filters.seller.id
            : [filters.seller.id]

        baseQuery = baseQuery
            .innerJoin(
                'seller_seller_inventory_inventory_item',
                'reservation.inventory_item_id',
                'seller_seller_inventory_inventory_item.inventory_item_id'
            )
            .whereIn('seller_seller_inventory_inventory_item.seller_id', sellerIds)
            .where('seller_seller_inventory_inventory_item.deleted_at', null)
    }

    if (filters?.id) {
        const ids = Array.isArray(filters.id) ? filters.id : [filters.id]
        baseQuery = baseQuery.whereIn('reservation.id', ids)
    }

    if (filters?.location_id) {
        const locationIds = Array.isArray(filters.location_id)
            ? filters.location_id
            : [filters.location_id]
        baseQuery = baseQuery.whereIn('reservation.location_id', locationIds)
    }

    if (filters?.inventory_item_id) {
        const inventoryItemIds = Array.isArray(filters.inventory_item_id)
            ? filters.inventory_item_id
            : [filters.inventory_item_id]
        baseQuery = baseQuery.whereIn('reservation.inventory_item_id', inventoryItemIds)
    }

    if (filters?.line_item_id) {
        const lineItemIds = Array.isArray(filters.line_item_id)
            ? filters.line_item_id
            : [filters.line_item_id]
        baseQuery = baseQuery.whereIn('reservation.line_item_id', lineItemIds)
    }

    const countQuery = baseQuery
        .clone()
        .clearSelect()
        .countDistinct('reservation.id as count')
    const [{ count }] = await countQuery
    const totalCount = parseInt(count as string, 10)

    const rows = await baseQuery
        .orderBy('reservation.created_at', 'desc')
        .offset(skip)
        .limit(take)

    const reservationIds = rows.map((row: { id: string }) => row.id)

    return { reservationIds, count: totalCount }
}

