import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/medusa";

export const fetchFeaturedCollectionWithProductsDetails = async (container: MedusaContainer, featuredCollectionId: string) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    const featuredCollectionWithProducts = await knex('featured_collection')
        .leftJoin('featured_collection_product', function () {
            this.onNull("featured_collection_product.deleted_at")
        })
        .leftJoin("product", function () {
            this.on(
                "featured_collection_product.product_id",
                "=",
                "product.id"
            )
                .andOnNull("product.deleted_at")
                .andOn("product.status", "=", knex.raw("?", ["published"]))
        })
        .where("featured_collection.id", featuredCollectionId)
        .whereNull("featured_collection.deleted_at")
        .select('featured_collection.*', 'featured_collection_product.position', 'product.id as product_id', 'product.title as product_title', 'product.thumbnail as product_thumbnail', 'product.handle as product_handle')
        .orderBy('featured_collection_product.position', 'asc');

    return mapSingleFeaturedCollectionWithProducts(featuredCollectionWithProducts);
}

export const mapSingleFeaturedCollectionWithProducts = (rows: any) => {
    if (!rows.length) {
        return null
    }

    const {
        position,
        product_id,
        product_title,
        product_thumbnail,
        product_handle,
        ...collection
    } = rows[0]

    return {
        ...collection,
        products: rows
            .filter(r => r.product_id)
            .map(r => ({
                id: r.product_id,
                title: r.product_title,
                thumbnail: r.product_thumbnail,
                handle: r.product_handle,
                position: r.position,
            })),
    }
}

export const fetchAllFeaturedCollectionsWithProductsDetails = async (container: MedusaContainer) => {
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    const featuredCollectionsWithProducts = await knex('featured_collection')
        .leftJoin('featured_collection_product', function () {
            this.on('featured_collection.id', '=', 'featured_collection_product.featured_collection_id')
                .andOnNull('featured_collection_product.deleted_at')
        })
        .leftJoin("product", function () {
            this.on(
                "featured_collection_product.product_id",
                "=",
                "product.id"
            )
                .andOnNull("product.deleted_at")
                .andOn("product.status", "=", knex.raw("?", ["published"]))
        })
        .whereNull("featured_collection.deleted_at")
        .select('featured_collection.*', 'featured_collection_product.position', 'product.id as product_id', 'product.title as product_title', 'product.thumbnail as product_thumbnail', 'product.handle as product_handle')
        .orderBy('featured_collection_product.position', 'asc');

    return mapManyFeaturedCollectionsWithProducts(featuredCollectionsWithProducts);
}

export const mapManyFeaturedCollectionsWithProducts = (rows: any[]) => {
    const map = new Map()

    for (const row of rows) {
        if (!map.has(row.id)) {
            const {
                position,
                product_id,
                product_title,
                product_thumbnail,
                product_handle,
                ...collection
            } = row

            map.set(row.id, {
                ...collection,
                products: [],
            })
        }

        if (row.product_id) {
            map.get(row.id).products.push({
                id: row.product_id,
                title: row.product_title,
                thumbnail: row.product_thumbnail,
                handle: row.product_handle,
                position: row.position,
            })
        }
    }

    return Array.from(map.values())
}