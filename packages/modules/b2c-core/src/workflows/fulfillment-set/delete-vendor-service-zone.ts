import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteServiceZonesWorkflow,
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows";

import { IntermediateEvents } from "@mercurjs/framework";
import { SELLER_MODULE } from "../../modules/seller";

import { emitMultipleEventsStep } from "../common/steps";

type WorkflowData = { ids: string[]; seller_id: string };

export const deleteVendorServiceZonesWorkflow = createWorkflow(
  "delete-vendor-service-zones",
  function ({ ids, seller_id }: WorkflowData) {
    deleteServiceZonesWorkflow.runAsStep({
      input: {
        ids,
      },
    });

    const links = transform({ ids, seller_id }, ({ ids, seller_id }) => {
      return ids.map((zone) => ({
        [SELLER_MODULE]: {
          seller_id,
        },
        [Modules.FULFILLMENT]: {
          service_zone_id: zone,
        },
      }));
    });

    const events = transform(ids, (ids) =>
      ids.map((id) => ({
        name: IntermediateEvents.SERVICE_ZONE_CHANGED,
        data: { id },
      }))
    );

    dismissRemoteLinkStep(links);
    emitMultipleEventsStep(events);
    return new WorkflowResponse(ids);
  }
);
