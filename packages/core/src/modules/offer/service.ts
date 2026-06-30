import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { Context, FindConfig } from "@medusajs/framework/types"

import { Offer } from "./models"

type OfferRow = {
  id: string
  product_id: string | null
  seller_id: string | null
  [key: string]: unknown
}

class OfferModuleService extends MedusaService({
  Offer,
}) {
  @InjectManager()
  // @ts-ignore - override narrows the generated signature
  async listOffers(
    filters: Record<string, unknown> = {},
    config: FindConfig<unknown> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<OfferRow[]> {
    if (!filters?.group_by_seller) {
      return super.listOffers(
        filters,
        config,
        sharedContext
      ) as unknown as Promise<OfferRow[]>
    }
    const [rows] = await this.listGroupedOffersBySeller_(
      filters,
      config,
      sharedContext
    )
    return rows
  }

  @InjectManager()
  // @ts-ignore - override narrows the generated signature
  async listAndCountOffers(
    filters: Record<string, unknown> = {},
    config: FindConfig<unknown> = {},
    @MedusaContext() sharedContext: Context = {}
  ): Promise<[OfferRow[], number]> {
    if (!filters?.group_by_seller) {
      return super.listAndCountOffers(
        filters,
        config,
        sharedContext
      ) as unknown as Promise<[OfferRow[], number]>
    }
    return this.listGroupedOffersBySeller_(filters, config, sharedContext)
  }

  private async listGroupedOffersBySeller_(
    filters: Record<string, unknown>,
    config: FindConfig<unknown>,
    sharedContext: Context
  ): Promise<[OfferRow[], number]> {
    const { group_by_seller: _flag, ...rest } = filters
    const skip = config.skip ?? 0
    const take = config.take ?? 20

    const offers = (await super.listOffers(
      rest,
      {
        ...config,
        skip: 0,
        take: null,
        order: config.order ?? { created_at: "DESC" },
      },
      sharedContext
    )) as unknown as OfferRow[]

    const representatives = new Map<string, OfferRow>()
    const order: string[] = []
    for (const offer of offers) {
      const key = `${offer.product_id}:${offer.seller_id}`
      if (!representatives.has(key)) {
        representatives.set(key, offer)
        order.push(key)
      }
    }

    const grouped = order.map((key) => representatives.get(key)!)
    return [grouped.slice(skip, skip + take), grouped.length]
  }
}

export default OfferModuleService
