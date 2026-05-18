import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const INDEXES_TO_DROP = [
  "IDX_fulfillment_set_name_unique",
  "IDX_shipping_profile_name_unique",
  "IDX_service_zone_name_unique",
] as const

export default async function dropFulfillmentGlobalUniqueIndexes({
  container,
}: ExecArgs) {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  await knex.transaction(async (trx: any) => {
    for (const indexName of INDEXES_TO_DROP) {
      await trx.raw(`DROP INDEX IF EXISTS "${indexName}"`)
    }
  })
}
