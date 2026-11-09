import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PgConnection = {
  transaction: (
    work: (trx: { raw: (sql: string) => Promise<unknown> }) => Promise<void>
  ) => Promise<void>
}

// `createOffersWorkflow` used to link every inventory item of a multi-seller
// batch to the first offer's seller, so items ended up shown under one store
// while stocked at another store's location. Point each item at the seller of
// the offer that sells it; items sold by several sellers are left alone.
export default async function repointInventoryItemSellers({
  container,
}: ExecArgs) {
  const knex = container.resolve<PgConnection>(
    ContainerRegistrationKeys.PG_CONNECTION
  )

  await knex.transaction(async (trx) => {
    await trx.raw(
      `WITH owner AS (
         SELECT oi.inventory_item_id, min(o.seller_id) AS seller_id
         FROM "offer_inventory_item" oi
         JOIN "offer" o ON o.id = oi.offer_id AND o.deleted_at IS NULL
         WHERE oi.deleted_at IS NULL
         GROUP BY oi.inventory_item_id
         HAVING count(DISTINCT o.seller_id) = 1
       )
       UPDATE "inventory_item_seller" l
       SET seller_id = owner.seller_id, updated_at = now()
       FROM owner
       WHERE l.inventory_item_id = owner.inventory_item_id
         AND l.deleted_at IS NULL
         AND l.seller_id <> owner.seller_id`
    )

    await trx.raw(
      `WITH owner AS (
         SELECT oi.inventory_item_id, min(o.seller_id) AS seller_id
         FROM "offer_inventory_item" oi
         JOIN "offer" o ON o.id = oi.offer_id AND o.deleted_at IS NULL
         WHERE oi.deleted_at IS NULL
         GROUP BY oi.inventory_item_id
         HAVING count(DISTINCT o.seller_id) = 1
       )
       INSERT INTO "inventory_item_seller" (id, inventory_item_id, seller_id, created_at, updated_at)
       SELECT 'link_' || replace(gen_random_uuid()::text, '-', ''),
              owner.inventory_item_id, owner.seller_id, now(), now()
       FROM owner
       WHERE NOT EXISTS (
         SELECT 1 FROM "inventory_item_seller" l
         WHERE l.inventory_item_id = owner.inventory_item_id
           AND l.deleted_at IS NULL
       )`
    )
  })
}
