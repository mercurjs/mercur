import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";

import {
  ATTRIBUTE_MODULE,
  AttributeModuleService,
} from "../../../modules/attribute";
import { AttributeUIComponent, UpdateAttributeValueDTO } from "@mercurjs/framework";

export const updateAttributePossibleValueStepId =
  "update-attribute-possible-value";

type StepInput = UpdateAttributeValueDTO;

export const updateAttributePossibleValueStep = createStep(
  updateAttributePossibleValueStepId,
  async (payload: StepInput, { container }) => {
    const attributeModuleService = container.resolve(
      ATTRIBUTE_MODULE
    ) as AttributeModuleService;

    if (payload.value !== undefined) {
      const [possibleValue] =
        await attributeModuleService.listAttributePossibleValues({
          id: payload.id,
        });

      if (!possibleValue) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Attribute possible value ${payload.id} not found`
        );
      }

      const [attribute] = await attributeModuleService.listAttributes({
        id: possibleValue.attribute_id,
      });

      if (
        attribute?.ui_component === AttributeUIComponent.TOGGLE
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Possible value cannot be updated for a TOGGLE attribute`
        );
      }
    }

    const updated =
      await attributeModuleService.updateAttributePossibleValues(payload);
    return new StepResponse(updated, payload.id);
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return;
    }

    const attributeModuleService = container.resolve(
      ATTRIBUTE_MODULE
    ) as AttributeModuleService;
    await attributeModuleService.deleteAttributePossibleValues(id);
  }
);
