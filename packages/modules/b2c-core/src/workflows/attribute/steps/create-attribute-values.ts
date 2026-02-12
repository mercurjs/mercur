import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { AttributeSource } from "@mercurjs/framework";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";

export const createAttributeValuesStepId = "create-attribute-values";

type CreateAttributeValuesStepInput = {
  attribute_id: string;
  values: string[];
  source: AttributeSource;
};

type CreateAttributeValuesStepOutput = {
  ids: string[];
};

export const createAttributeValuesStep = createStep(
  createAttributeValuesStepId,
  async (input: CreateAttributeValuesStepInput, { container }) => {
    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    const created = await Promise.all(
      input.values.map((value) =>
        attributeModuleService.createAttributeValues({
          value,
          attribute_id: input.attribute_id,
          source: input.source,
          rank: 0,
        })
      )
    );

    const ids = created.map((value) => value.id);

    return new StepResponse<CreateAttributeValuesStepOutput, string[]>(
      { ids },
      ids
    );
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return;
    }

    const attributeModuleService =
      container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    await attributeModuleService.deleteAttributeValues(ids);
  }
);
