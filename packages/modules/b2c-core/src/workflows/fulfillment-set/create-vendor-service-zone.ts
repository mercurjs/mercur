import { CreateServiceZoneDTO } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createRemoteLinkStep,
  createServiceZonesWorkflow,
} from "@medusajs/medusa/core-flows";

import { IntermediateEvents } from "@mercurjs/framework";
import { SELLER_MODULE } from "../../modules/seller";

import { emitMultipleEventsStep } from "../common/steps";

type WorkflowData = { seller_id: string; data: CreateServiceZoneDTO[] };

export const createVendorServiceZonesWorkflow = createWorkflow(
  "create-vendor-service-zones",
  function ({ data, seller_id }: WorkflowData) {
    const zones = createServiceZonesWorkflow.runAsStep({ input: { data } });

    const links = transform({ zones, seller_id }, ({ zones, seller_id }) => {
      return zones.map((zone) => ({
        [SELLER_MODULE]: {
          seller_id: seller_id,
        },
        [Modules.FULFILLMENT]: {
          service_zone_id: zone.id,
        },
      }));
    });

    const events = transform(zones, (zones) =>
      zones.map((z) => ({
        name: IntermediateEvents.SERVICE_ZONE_CHANGED,
        data: { id: z.id },
      }))
    );

    createRemoteLinkStep(links);
    emitMultipleEventsStep(events);
    return new WorkflowResponse(zones);
  }
);
