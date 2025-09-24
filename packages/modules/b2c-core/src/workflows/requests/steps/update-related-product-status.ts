import { MedusaError } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { UpdateRequestDataDTO } from "@mercurjs/framework";
import {
  REQUESTS_MODULE,
  RequestsModuleService,
} from "../../../modules/requests";
import { updateProductStatusWorkflow } from "../../product/workflows";

export const updateRelatedProductStatusStep = createStep(
  "update-related-product-status",
  async (id: string, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    const request = await service.retrieveRequest(id);

    if (
      ["product", "product_update"].includes(request.type) &&
      request.status === "rejected"
    ) {
      await updateProductStatusWorkflow.run({
        container,
        input: {
          id: request.data.product_id,
          status: "rejected",
        },
      });
    }
  }
);
