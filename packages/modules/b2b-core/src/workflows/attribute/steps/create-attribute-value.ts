import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";
import { CreateProductAttributeValueDTO } from "@mercurjs/framework";

export const createAttributeValueStepId = "create-attribute-value";

export const createAttributeValueStep = createStep(
  createAttributeValueStepId,
  async (
    input: Omit<CreateProductAttributeValueDTO, "product_id">,
    { container }
  ) => {
    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    const created = await attributeModuleService.createAttributeValues({
      ...input,
      rank: 0,
    });

    return new StepResponse(created, created.id);
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return;
    }

    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);
    await attributeModuleService.deleteAttributeValues(id);
  }
);
