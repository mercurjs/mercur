import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { Context, FindConfig } from "@medusajs/framework/types"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { OfferDTO } from "@mercurjs/types"

import { Offer } from "./models"

type OfferFilters = Record<string, unknown> & { group_by_seller?: boolean }

const toArray = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).map(String)

class OfferModuleService extends MedusaService({
  Offer,
}) {
  @InjectManager()
  // @ts-ignore - override narrows the generated signature
  async listOffers(
    filters: OfferFilters = {},
    config: FindConfig<OfferDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<OfferDTO[]> {
    if (!filters.group_by_seller) {
      return super.listOffers(
        filters,
        config,
        sharedContext
      ) as unknown as Promise<OfferDTO[]>
    }
    const [offers] = await this.listGroupedOffersBySeller_(
      filters,
      config,
      sharedContext
    )
    return offers
  }

  @InjectManager()
  // @ts-ignore - override narrows the generated signature
  async listAndCountOffers(
    filters: OfferFilters = {},
    config: FindConfig<OfferDTO> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[OfferDTO[], number]> {
    if (!filters.group_by_seller) {
      return super.listAndCountOffers(
        filters,
        config,
        sharedContext
      ) as unknown as Promise<[OfferDTO[], number]>
    }
    return this.listGroupedOffersBySeller_(filters, config, sharedContext)
  }

  private async listGroupedOffersBySeller_(
    filters: OfferFilters,
    config: FindConfig<OfferDTO>,
    sharedContext: Context
  ): Promise<[OfferDTO[], number]> {
    const { group_by_seller: _flag, ...rest } = filters
    const skip = config.skip ?? 0
    const take = config.take ?? 20

    const { baseRepository_ } = this as unknown as {
      baseRepository_: { getActiveManager<T>(context?: Context): T }
    }
    const manager =
      baseRepository_.getActiveManager<SqlEntityManager>(sharedContext)
    const knex = manager.getKnex()

    const scoped = () => {
      const qb = knex("offer").whereNull("deleted_at")
      if (rest.product_id !== undefined) {
        qb.whereIn("product_id", toArray(rest.product_id))
      }
      if (rest.seller_id !== undefined) {
        qb.whereIn("seller_id", toArray(rest.seller_id))
      }
      return qb
    }

    const idRows = (await scoped()
      .distinctOn("product_id", "seller_id")
      .select("id")
      .orderBy([
        { column: "product_id" },
        { column: "seller_id" },
        { column: "created_at", order: "desc" },
      ])
      .limit(take)
      .offset(skip)) as Array<{ id: string }>

    const countRow = (await knex
      .count({ count: "*" })
      .from(
        scoped().groupBy("product_id", "seller_id").select(knex.raw("1")).as(
          "groups"
        )
      )
      .first()) as { count?: string | number } | undefined
    const count = Number(countRow?.count ?? 0)

    const ids = idRows.map((row) => row.id)
    if (!ids.length) {
      return [[], count]
    }

    const offers = (await super.listOffers(
      { id: ids } as OfferFilters,
      { ...config, skip: 0, take: ids.length },
      sharedContext
    )) as unknown as OfferDTO[]

    const rank = new Map(ids.map((id, index) => [id, index]))
    offers.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))

    const groupRows = (await scoped()
      .select("id", "product_id", "seller_id")
      .orderBy("created_at", "desc")) as Array<{
      id: string
      product_id: string
      seller_id: string
    }>

    const idsByGroup = new Map<string, string[]>()
    for (const row of groupRows) {
      const key = `${row.product_id}:${row.seller_id}`
      const list = idsByGroup.get(key)
      if (list) {
        list.push(row.id)
      } else {
        idsByGroup.set(key, [row.id])
      }
    }

    for (const offer of offers) {
      const groupIds =
        idsByGroup.get(`${offer.product_id}:${offer.seller_id}`) ?? []
      offer.variant_count = groupIds.length
      offer.offer_ids = groupIds
    }

    return [offers, count]
  }
}

export default OfferModuleService
