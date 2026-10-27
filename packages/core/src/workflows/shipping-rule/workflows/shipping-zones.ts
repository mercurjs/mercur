import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateServiceZonesWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { CreateShippingZoneDTO, UpdateShippingZoneDTO } from "@mercurjs/types"

import {
  createShippingZonesStep,
  deleteShippingZonesStep,
  updateShippingZonesStep,
} from "../steps"

type LinkedShippingZone = {
  id: string
  geo_zones: {
    type: "country" | "province"
    country_code: string
    province_code: string | null
  }[]
  service_zones?: { id: string }[] | null
}

export const createShippingZonesWorkflowId = "create-shipping-zones"

export const createShippingZonesWorkflow = createWorkflow(
  createShippingZonesWorkflowId,
  (input: WorkflowData<{ shipping_zones: CreateShippingZoneDTO[] }>) => {
    const zones = createShippingZonesStep(input.shipping_zones)
    return new WorkflowResponse(zones)
  }
)

export const updateShippingZoneWorkflowId = "update-shipping-zone"

/**
 * Service zones enabled from a shipping zone copy its geography, so a geography
 * change is pushed down to every one of them.
 */
export const updateShippingZoneWorkflow = createWorkflow(
  updateShippingZoneWorkflowId,
  (input: WorkflowData<UpdateShippingZoneDTO>) => {
    const zones = updateShippingZonesStep(
      transform({ input }, ({ input }) => [input])
    )

    const { data: linked } = useQueryGraphStep({
      entity: "shipping_zone",
      fields: ["id", "geo_zones.*", "service_zones.id"],
      filters: { id: input.id },
    }).config({ name: "get-linked-service-zones" })

    const serviceZoneUpdate = transform(
      { input, linked },
      ({ input, linked }) => {
        const zone = (linked as LinkedShippingZone[])[0]
        if (!input.geo_zones || !zone?.service_zones?.length) {
          return null
        }
        return {
          selector: { id: zone.service_zones.map((sz) => sz.id) },
          update: {
            geo_zones: zone.geo_zones.map((geo) =>
              geo.type === "province" && geo.province_code
                ? {
                    type: "province" as const,
                    country_code: geo.country_code,
                    province_code: geo.province_code,
                  }
                : { type: "country" as const, country_code: geo.country_code }
            ),
          },
        }
      }
    )

    when({ serviceZoneUpdate }, ({ serviceZoneUpdate }) => !!serviceZoneUpdate).then(
      () => {
        updateServiceZonesWorkflow.runAsStep({
          input: transform({ serviceZoneUpdate }, ({ serviceZoneUpdate }) => serviceZoneUpdate!),
        })
      }
    )

    return new WorkflowResponse(
      transform({ zones }, ({ zones }) => zones[0])
    )
  }
)

export const deleteShippingZonesWorkflowId = "delete-shipping-zones"

export const deleteShippingZonesWorkflow = createWorkflow(
  deleteShippingZonesWorkflowId,
  (input: WorkflowData<{ ids: string[] }>) => {
    deleteShippingZonesStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)
