import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import {
  CreateShippingRuleDTO,
  CreateShippingZoneDTO,
  ShippingRulePriceInput,
  UpdateShippingRuleDTO,
  UpdateShippingZoneDTO,
} from "@mercurjs/types"

import {
  MarketplaceShippingMethod,
  ShippingRule,
  ShippingRulePrice,
  ShippingZone,
  ShippingZoneArea,
} from "./models"

class ShippingRuleModuleService extends MedusaService({
  ShippingZone,
  ShippingZoneArea,
  MarketplaceShippingMethod,
  ShippingRule,
  ShippingRulePrice,
}) {
  @InjectManager()
  async createShippingZonesWithGeo(
    data: CreateShippingZoneDTO[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const ids = await this.createShippingZonesWithGeo_(data, sharedContext)
    return await this.listShippingZones(
      { id: ids },
      { relations: ["geo_zones"] },
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async createShippingZonesWithGeo_(
    data: CreateShippingZoneDTO[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    const zones = await this.createShippingZones(
      data.map(({ geo_zones: _geo, ...zone }) => zone),
      sharedContext
    )
    const geo = zones.flatMap((zone, idx) =>
      data[idx].geo_zones.map((g) => ({ ...g, shipping_zone_id: zone.id }))
    )
    if (geo.length) {
      await this.createShippingZoneAreas(geo, sharedContext)
    }
    return zones.map((zone) => zone.id)
  }

  @InjectManager()
  async updateShippingZonesWithGeo(
    data: UpdateShippingZoneDTO[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    await this.updateShippingZonesWithGeo_(data, sharedContext)
    return await this.listShippingZones(
      { id: data.map((zone) => zone.id) },
      { relations: ["geo_zones"] },
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async updateShippingZonesWithGeo_(
    data: UpdateShippingZoneDTO[],
    @MedusaContext() sharedContext: Context = {}
  ) {
    await this.updateShippingZones(
      data.map(({ geo_zones: _geo, ...zone }) => zone),
      sharedContext
    )
    const withGeo = data.filter((zone) => zone.geo_zones)
    if (!withGeo.length) {
      return
    }
    const existing = await this.listShippingZoneAreas(
      { shipping_zone_id: withGeo.map((zone) => zone.id) },
      { select: ["id"] },
      sharedContext
    )
    if (existing.length) {
      await this.deleteShippingZoneAreas(
        existing.map((g) => g.id),
        sharedContext
      )
    }
    await this.createShippingZoneAreas(
      withGeo.flatMap((zone) =>
        zone.geo_zones!.map((g) => ({ ...g, shipping_zone_id: zone.id }))
      ),
      sharedContext
    )
  }

  @InjectManager()
  async upsertShippingRulesWithPrices(
    data: {
      create?: CreateShippingRuleDTO[]
      update?: UpdateShippingRuleDTO[]
    },
    @MedusaContext() sharedContext: Context = {}
  ) {
    const ids = await this.upsertShippingRulesWithPrices_(data, sharedContext)
    return await this.listShippingRules(
      { id: ids },
      { relations: ["prices"] },
      sharedContext
    )
  }

  @InjectTransactionManager()
  protected async upsertShippingRulesWithPrices_(
    data: {
      create?: CreateShippingRuleDTO[]
      update?: UpdateShippingRuleDTO[]
    },
    @MedusaContext() sharedContext: Context = {}
  ) {
    const toCreate = data.create ?? []
    const toUpdate = data.update ?? []

    const created = toCreate.length
      ? await this.createShippingRules(
          toCreate.map(({ prices: _prices, ...rule }) => rule),
          sharedContext
        )
      : []

    if (toUpdate.length) {
      await this.updateShippingRules(
        toUpdate.map(({ prices: _prices, ...rule }) => rule),
        sharedContext
      )
    }

    const replaced = toUpdate.filter((rule) => rule.prices)
    if (replaced.length) {
      const existing = await this.listShippingRulePrices(
        { shipping_rule_id: replaced.map((rule) => rule.id) },
        { select: ["id"] },
        sharedContext
      )
      if (existing.length) {
        await this.deleteShippingRulePrices(
          existing.map((price) => price.id),
          sharedContext
        )
      }
    }

    const prices: (ShippingRulePriceInput & { shipping_rule_id: string })[] = [
      ...created.flatMap((rule, idx) =>
        (toCreate[idx].prices ?? []).map((price) => ({
          ...price,
          shipping_rule_id: rule.id,
        }))
      ),
      ...replaced.flatMap((rule) =>
        rule.prices!.map((price) => ({ ...price, shipping_rule_id: rule.id }))
      ),
    ]
    if (prices.length) {
      await this.createShippingRulePrices(prices, sharedContext)
    }

    return [
      ...created.map((rule) => rule.id),
      ...toUpdate.map((rule) => rule.id),
    ]
  }
}

export default ShippingRuleModuleService
