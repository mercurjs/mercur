import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { UpdateRequestDTO } from "@mercurjs/framework";
import {
  REQUESTS_MODULE,
  RequestsModuleService,
} from "../../../modules/requests";

export const updateRequestStep = createStep(
  "update-request",
  async (input: UpdateRequestDTO, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    const request = await service.updateRequests(input);

    return new StepResponse(request[0], request[0].id);
  }
);
