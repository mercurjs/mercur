import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context } from "@medusajs/framework/types"
import { DALUtils } from "@medusajs/framework/utils"

export type SellerStatusCountRow = {
  status: string
  count: string | number
  premium: string | number | null
}

export class SellerStatisticsRepository extends DALUtils.MikroOrmBase {
  constructor() {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
  }

  async countByStatus(sharedContext: Context = {}): Promise<SellerStatusCountRow[]> {
    const knex = this.getActiveManager<SqlEntityManager>(sharedContext).getKnex()

    return (await knex("seller")
      .whereNull("deleted_at")
      .select("status")
      .count({ count: "*" })
      .sum({ premium: knex.raw("CASE WHEN is_premium THEN 1 ELSE 0 END") })
      .groupBy("status")) as SellerStatusCountRow[]
  }
}
