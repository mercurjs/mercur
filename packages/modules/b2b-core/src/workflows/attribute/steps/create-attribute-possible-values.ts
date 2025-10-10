import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";
import { CreateAttributeValueDTO } from "@mercurjs/framework";

export const createAttributePossibleValuesStepId =
  "create-attribute-possible-values";

export type CreateAttributePossibleValuesStepInput = CreateAttributeValueDTO[];

export const createAttributePossibleValuesStep = createStep(
  createAttributePossibleValuesStepId,
  async (data: CreateAttributePossibleValuesStepInput, { container }) => {
    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    const values = await service.createAttributePossibleValues(data);

    return new StepResponse(
      values,
      values.map((val) => val.id)
    );
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return;
    }

    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    await service.deleteAttributeValues(ids);
  }
);
