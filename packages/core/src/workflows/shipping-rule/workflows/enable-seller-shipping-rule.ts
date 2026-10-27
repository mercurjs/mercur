import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { FulfillmentWorkflow, LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  batchLinksWorkflow,
  createLocationFulfillmentSetWorkflow,
  createRemoteLinkStep,
  createServiceZonesWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { createSellerShippingOptionsWorkflow } from "../../shipping-option/workflows/create-seller-shipping-options"
import {
  EnablementLocation,
  EnablementRule,
  SellerShippingPriceInput,
  validateShippingRuleEnablementStep,
} from "../steps"

export type EnableSellerShippingRuleWorkflowInput = {
  seller_id: string
  shipping_rule_id: string
  stock_location_id: string
  prices?: SellerShippingPriceInput[]
  transit_min_days?: number | null
  transit_max_days?: number | null
}

const RULE_FIELDS = [
  "id",
  "requirement",
  "price_type",
  "seller_can_edit_price",
  "seller_can_edit_transit",
  "transit_min_days",
  "transit_max_days",
  "shipping_profile_id",
  "prices.*",
  "shipping_zone.id",
  "shipping_zone.name",
  "shipping_zone.code",
  "shipping_zone.is_active",
  "shipping_zone.geo_zones.*",
  "shipping_method.id",
  "shipping_method.name",
  "shipping_method.is_active",
  "shipping_method.provider_id",
  "shipping_method.shipping_option_type_id",
  "shipping_options.id",
  "shipping_options.service_zone_id",
]

const LOCATION_FIELDS = [
  "id",
  "name",
  "seller.id",
  "fulfillment_providers.id",
  "fulfillment_sets.id",
  "fulfillment_sets.type",
  "fulfillment_sets.service_zones.id",
  "fulfillment_sets.service_zones.shipping_zone.id",
]

type RuleGeoZone = {
  type: "country" | "province"
  country_code: string
  province_code: string | null
}

type Rule = Omit<EnablementRule, "shipping_zone" | "shipping_method"> & {
  shipping_profile_id: string
  shipping_zone: {
    id: string
    name: string
    code: string
    is_active: boolean
    geo_zones: RuleGeoZone[]
  }
  shipping_method: {
    id: string
    is_active: boolean
    name: string
    provider_id: string
    shipping_option_type_id: string
  }
}

type Location = EnablementLocation & {
  fulfillment_providers?: { id: string }[] | null
}

const findShippingSet = (location: Location) =>
  (location.fulfillment_sets ?? []).find((set) => set.type === "shipping")

export const enableSellerShippingRuleWorkflowId =
  "enable-seller-shipping-rule"

/**
 * Turns an operator shipping rule on for one of the seller's stock locations:
 * the location gets a shipping fulfillment set, a service zone mirroring the
 * rule's shipping zone and the method's provider, then a shipping option whose
 * provider, type and profile come from the rule.
 */
export const enableSellerShippingRuleWorkflow = createWorkflow(
  enableSellerShippingRuleWorkflowId,
  (input: WorkflowData<EnableSellerShippingRuleWorkflowInput>) => {
    const { data: rules } = useQueryGraphStep({
      entity: "shipping_rule",
      fields: RULE_FIELDS,
      filters: { id: input.shipping_rule_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-shipping-rule" })

    const { data: locations } = useQueryGraphStep({
      entity: "stock_location",
      fields: LOCATION_FIELDS,
      filters: { id: input.stock_location_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-stock-location" })

    const rule = transform({ rules }, ({ rules }) => rules[0] as unknown as Rule)
    const location = transform(
      { locations },
      ({ locations }) => locations[0] as unknown as Location
    )

    const resolved = validateShippingRuleEnablementStep({
      seller_id: input.seller_id,
      rule,
      location,
      prices: input.prices,
      transit_min_days: input.transit_min_days,
      transit_max_days: input.transit_max_days,
    })

    when({ location }, ({ location }) => !findShippingSet(location)).then(
      () => {
        createLocationFulfillmentSetWorkflow.runAsStep({
          input: transform({ location }, ({ location }) => ({
            location_id: location.id,
            fulfillment_set_data: {
              name: `${location.name} shipping (${location.id})`,
              type: "shipping",
            },
          })),
        })
      }
    )

    const { data: refreshedLocations } = useQueryGraphStep({
      entity: "stock_location",
      fields: LOCATION_FIELDS,
      filters: { id: input.stock_location_id },
    }).config({ name: "refetch-stock-location" })

    const target = transform(
      { refreshedLocations, rule },
      ({ refreshedLocations, rule }) => {
        const refreshed = refreshedLocations[0] as unknown as Location
        const shippingSet = findShippingSet(refreshed)!
        const serviceZone = (shippingSet.service_zones ?? []).find(
          (zone) => zone.shipping_zone?.id === rule.shipping_zone.id
        )
        const hasProvider = (refreshed.fulfillment_providers ?? []).some(
          (provider) => provider.id === rule.shipping_method.provider_id
        )
        return {
          location_id: refreshed.id,
          fulfillment_set_id: shippingSet.id,
          service_zone_id: serviceZone?.id ?? null,
          has_provider: hasProvider,
        }
      }
    )

    const createdZones = when(
      { target },
      ({ target }) => !target.service_zone_id
    ).then(() => {
      const zones = createServiceZonesWorkflow.runAsStep({
        input: transform({ target, rule }, ({ target, rule }) => ({
          data: [
            {
              fulfillment_set_id: target.fulfillment_set_id,
              name: `${rule.shipping_zone.name} (${target.fulfillment_set_id})`,
              geo_zones: rule.shipping_zone.geo_zones.map((geo) =>
                geo.type === "province" && geo.province_code
                  ? {
                      type: "province" as const,
                      country_code: geo.country_code,
                      province_code: geo.province_code,
                    }
                  : {
                      type: "country" as const,
                      country_code: geo.country_code,
                    }
              ),
            },
          ],
        })),
      })

      createRemoteLinkStep(
        transform({ zones, rule }, ({ zones, rule }): LinkDefinition[] => [
          {
            [Modules.FULFILLMENT]: { service_zone_id: zones[0].id },
            [MercurModules.SHIPPING_RULE]: {
              shipping_zone_id: rule.shipping_zone.id,
            },
          },
        ])
      ).config({ name: "link-service-zone-shipping-zone" })

      return zones
    })

    when({ target }, ({ target }) => !target.has_provider).then(() => {
      batchLinksWorkflow.runAsStep({
        input: transform({ target, rule }, ({ target, rule }) => ({
          create: [
            {
              [Modules.STOCK_LOCATION]: { stock_location_id: target.location_id },
              [Modules.FULFILLMENT]: {
                fulfillment_provider_id: rule.shipping_method.provider_id,
              },
            },
          ],
        })),
      })
    })

    const shippingOptionInput = transform(
      { target, createdZones, rule, resolved },
      ({ target, createdZones, rule, resolved }) => {
        const serviceZoneId = target.service_zone_id ?? createdZones![0].id
        const option = {
          name: rule.shipping_method.name,
          service_zone_id: serviceZoneId,
          shipping_profile_id: rule.shipping_profile_id,
          provider_id: rule.shipping_method.provider_id,
          type_id: rule.shipping_method.shipping_option_type_id,
          price_type: rule.price_type,
          ...(rule.price_type === "flat" ? { prices: resolved.prices } : {}),
          data: {},
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
          ...(resolved.metadata ? { metadata: resolved.metadata } : {}),
        }
        return [
          option as unknown as FulfillmentWorkflow.CreateShippingOptionsWorkflowInput,
        ]
      }
    )

    const created = createSellerShippingOptionsWorkflow.runAsStep({
      input: {
        seller_id: input.seller_id,
        shipping_options: shippingOptionInput,
      },
    })

    createRemoteLinkStep(
      transform({ created, rule }, ({ created, rule }): LinkDefinition[] =>
        created.map((option) => ({
          [Modules.FULFILLMENT]: { shipping_option_id: option.id },
          [MercurModules.SHIPPING_RULE]: { shipping_rule_id: rule.id },
        }))
      )
    ).config({ name: "link-shipping-option-shipping-rule" })

    return new WorkflowResponse(
      transform({ created }, ({ created }) => created[0])
    )
  }
)
