import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import { deleteProductOptionsWorkflow } from "@medusajs/medusa/core-flows";

import { AttributeSource } from "@mercurjs/framework";

import { createAndLinkAttributeValuesWorkflow } from "./create-and-link-attribute-values";

export const convertOptionToAttributeWorkflowId = "convert-option-to-attribute";

type ConvertOptionToAttributeWorkflowInput = {
  product_id: string;
  option_id: string;
  seller_id: string;
  attribute_id: string;
  values: string[];
};

export const convertOptionToAttributeWorkflow = createWorkflow(
  convertOptionToAttributeWorkflowId,
  (input: ConvertOptionToAttributeWorkflowInput) => {
    const createAttributeValuesInput = transform({ input }, ({ input }) => ({
      product_id: input.product_id,
      attribute_id: input.attribute_id,
      seller_id: input.seller_id,
      values: input.values.map((value) => ({
        value,
        source: AttributeSource.VENDOR,
      })),
    }));

    const createdAttributeValues = createAndLinkAttributeValuesWorkflow.runAsStep({
      input: createAttributeValuesInput,
    });

    deleteProductOptionsWorkflow.runAsStep({
      input: { ids: [input.option_id] },
    });

    return new WorkflowResponse({
      attribute_value_ids: createdAttributeValues.ids,
    });
  }
);
