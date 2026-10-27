import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
  CreateShippingZoneDTO,
  MercurModules,
  UpdateShippingZoneDTO,
} from "@mercurjs/types"

import ShippingRuleModuleService from "../../../modules/shipping-rule/service"

export const createShippingZonesStepId = "create-shipping-zones"

export const createShippingZonesStep = createStep(
  createShippingZonesStepId,
  async (input: CreateShippingZoneDTO[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    const zones = await service.createShippingZonesWithGeo(input)
    return new StepResponse(
      zones,
      zones.map((zone) => zone.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.deleteShippingZones(ids)
  }
)

export const updateShippingZonesStepId = "update-shipping-zones"

export const updateShippingZonesStep = createStep(
  updateShippingZonesStepId,
  async (input: UpdateShippingZoneDTO[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    const before = await service.listShippingZones(
      { id: input.map((zone) => zone.id) },
      { relations: ["geo_zones"] }
    )
    const zones = await service.updateShippingZonesWithGeo(input)

    const compensation: UpdateShippingZoneDTO[] = before.map((prev) => ({
      id: prev.id,
      name: prev.name,
      is_active: prev.is_active,
      metadata: prev.metadata ?? null,
      geo_zones: prev.geo_zones.map((geo) => ({
        type: geo.type,
        country_code: geo.country_code,
        province_code: geo.province_code,
      })),
    }))

    return new StepResponse(zones, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.updateShippingZonesWithGeo(compensation)
  }
)

export const deleteShippingZonesStepId = "delete-shipping-zones"

export const deleteShippingZonesStep = createStep(
  deleteShippingZonesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.softDeleteShippingZones(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<ShippingRuleModuleService>(
      MercurModules.SHIPPING_RULE
    )
    await service.restoreShippingZones(ids)
  }
)
