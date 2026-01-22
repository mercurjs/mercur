import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";
import { AttributeUIComponent, CreateAttributeValueDTO } from "@mercurjs/framework";


export const createAttributePossibleValuesStepId =
  "create-attribute-possible-values";

export type CreateAttributePossibleValuesStepInput = CreateAttributeValueDTO[];

export const createAttributePossibleValuesStep = createStep(
  createAttributePossibleValuesStepId,
  async (data: CreateAttributePossibleValuesStepInput, { container }) => {
    const service = container.resolve<AttributeModuleService>(ATTRIBUTE_MODULE);

    const attributeIds = [...new Set(data.map((d) => d.attribute_id))];
    const attributes = await service.listAttributes({
      id: attributeIds,
    });

    const attributeMap = new Map(attributes.map((a) => [a.id, a]));

    for (const item of data) {
      const attribute = attributeMap.get(item.attribute_id);

      if (!attribute) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Attribute ${item.attribute_id} not found`
        );
      }

      if (attribute.ui_component === AttributeUIComponent.TOGGLE || attribute.ui_component === AttributeUIComponent.UNIT) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot add possible values to a TOGGLE or UNIT attribute"
        );
      }
    }

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
