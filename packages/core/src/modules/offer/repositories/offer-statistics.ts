import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context } from "@medusajs/framework/types"
import { DALUtils } from "@medusajs/framework/utils"
import { OfferStatisticsInput } from "@mercurjs/types"

export type OfferCountRow = {
  offers: string | number
  sellers: string | number
  products: string | number
}

export class OfferStatisticsRepository extends DALUtils.MikroOrmBase {
  constructor() {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
  }

  async countAt(
    { at, filters }: { at: Date; filters?: OfferStatisticsInput["filters"] },
    sharedContext: Context = {}
  ): Promise<OfferCountRow> {
    const knex = this.getActiveManager<SqlEntityManager>(sharedContext).getKnex()

    const q = knex("offer")
      .where("created_at", "<=", at)
      .andWhere((w) => w.whereNull("deleted_at").orWhere("deleted_at", ">", at))

    const sellerIds = filters?.seller_id
    if (sellerIds) {
      q.whereIn("seller_id", Array.isArray(sellerIds) ? sellerIds : [sellerIds])
    }

    const [row] = (await q
      .count({ offers: "*" })
      .countDistinct({ sellers: "seller_id" })
      .countDistinct({ products: "product_id" })) as OfferCountRow[]

    return row
  }
}
