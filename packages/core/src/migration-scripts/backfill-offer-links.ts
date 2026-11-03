import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type PgConnection = {
  transaction: (
    work: (trx: { raw: (sql: string) => Promise<unknown> }) => Promise<void>
  ) => Promise<void>
}

const LINK_TABLES = [
  { table: "offer_seller", column: "seller_id" },
  { table: "offer_product", column: "product_id" },
] as const

// `offer_seller` and `offer_product` used to be read-only links resolved from
// the offer's own columns. Offers created before they became link tables have
// no rows there, so this seeds them. Runs after `db:migrate` syncs the links.
export default async function backfillOfferLinks({ container }: ExecArgs) {
  const knex = container.resolve<PgConnection>(
    ContainerRegistrationKeys.PG_CONNECTION
  )

  await knex.transaction(async (trx) => {
    for (const { table, column } of LINK_TABLES) {
      await trx.raw(
        `INSERT INTO "${table}" (id, offer_id, "${column}", created_at, updated_at)
         SELECT 'link_' || replace(gen_random_uuid()::text, '-', ''),
                o.id, o."${column}", now(), now()
         FROM "offer" o
         WHERE o.deleted_at IS NULL
           AND o."${column}" IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM "${table}" l
             WHERE l.offer_id = o.id AND l."${column}" = o."${column}"
           )`
      )
    }
  })
}
