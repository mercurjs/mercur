import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AcceptRequestDTO } from "@mercurjs/framework";
import { kebabCase } from "@medusajs/framework/utils";

export const createHandleFromNameStep = createStep(
    "create-handle-from-name",
    async (input: AcceptRequestDTO) => {
      const handle = input.data.handle === ''
        ? kebabCase(input.data.name)
        : input.data.handle
      return new StepResponse(handle);
    }
  );