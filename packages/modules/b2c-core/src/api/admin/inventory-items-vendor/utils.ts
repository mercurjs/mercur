import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export type InventoryItemFilters = {
    q?: string
    id?: string | string[]
    sku?: string | string[]
    origin_country?: string | string[]
    mid_code?: string | string[]
    hs_code?: string | string[]
    material?: string | string[]
    requires_shipping?: boolean
    location_levels?: { location_id?: string | string[] }
    seller?: { id?: string | string[] }
}

export const filterInventoryItemsBySeller = async (
    container: MedusaContainer,
    skip: number,
    take: number,
    filters?: InventoryItemFilters
) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    let baseQuery = knex('inventory_item')
        .distinct('inventory_item.id', 'inventory_item.created_at')
        .where('inventory_item.deleted_at', null)

    if (filters?.seller?.id) {
        const sellerIds = Array.isArray(filters.seller.id)
            ? filters.seller.id
            : [filters.seller.id]

        baseQuery = baseQuery
            .innerJoin(
                'seller_seller_inventory_inventory_item',
                'inventory_item.id',
                'seller_seller_inventory_inventory_item.inventory_item_id'
            )
            .whereIn('seller_seller_inventory_inventory_item.seller_id', sellerIds)
            .where('seller_seller_inventory_inventory_item.deleted_at', null)
    }

    if (filters?.q) {
        const searchTerm = `%${filters.q}%`
        baseQuery = baseQuery.andWhere(function () {
            this.whereILike('inventory_item.sku', searchTerm)
                .orWhereILike('inventory_item.title', searchTerm)
                .orWhereILike('inventory_item.id', searchTerm)
        })
    }

    if (filters?.id) {
        const ids = Array.isArray(filters.id) ? filters.id : [filters.id]
        baseQuery = baseQuery.whereIn('inventory_item.id', ids)
    }

    if (filters?.sku) {
        const skus = Array.isArray(filters.sku) ? filters.sku : [filters.sku]
        baseQuery = baseQuery.whereIn('inventory_item.sku', skus)
    }

    if (filters?.origin_country) {
        const countries = Array.isArray(filters.origin_country)
            ? filters.origin_country
            : [filters.origin_country]
        baseQuery = baseQuery.whereIn('inventory_item.origin_country', countries)
    }

    if (filters?.mid_code) {
        const midCodes = Array.isArray(filters.mid_code)
            ? filters.mid_code
            : [filters.mid_code]
        baseQuery = baseQuery.whereIn('inventory_item.mid_code', midCodes)
    }

    if (filters?.hs_code) {
        const hsCodes = Array.isArray(filters.hs_code)
            ? filters.hs_code
            : [filters.hs_code]
        baseQuery = baseQuery.whereIn('inventory_item.hs_code', hsCodes)
    }

    if (filters?.material) {
        const materials = Array.isArray(filters.material)
            ? filters.material
            : [filters.material]
        baseQuery = baseQuery.whereIn('inventory_item.material', materials)
    }

    if (filters?.requires_shipping !== undefined) {
        baseQuery = baseQuery.where('inventory_item.requires_shipping', filters.requires_shipping)
    }

    if (filters?.location_levels?.location_id) {
        const locationIds = Array.isArray(filters.location_levels.location_id)
            ? filters.location_levels.location_id
            : [filters.location_levels.location_id]
        baseQuery = baseQuery
            .innerJoin(
                'inventory_level',
                'inventory_item.id',
                'inventory_level.inventory_item_id'
            )
            .whereIn('inventory_level.location_id', locationIds)
            .where('inventory_level.deleted_at', null)
    }

    const countQuery = baseQuery
        .clone()
        .clearSelect()
        .countDistinct('inventory_item.id as count')
    const [{ count }] = await countQuery
    const totalCount = parseInt(count as string, 10)

    const rows = await baseQuery
        .orderBy('inventory_item.created_at', 'desc')
        .offset(skip)
        .limit(take)

    const inventoryItemIds = rows.map((row: { id: string }) => row.id)

    return { inventoryItemIds, count: totalCount }
}

