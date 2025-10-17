import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";

export const deleteAttributeValueStepId = "delete-attribute-value";

export const deleteAttributeValueStep = createStep(
  deleteAttributeValueStepId,
  async (ids: string[], { container }) => {
    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    await attributeModuleService.softDeleteAttributeValues(ids);

    return new StepResponse(ids, ids);
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return;
    }

    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    await attributeModuleService.restoreAttributeValues(ids);
  }
);
