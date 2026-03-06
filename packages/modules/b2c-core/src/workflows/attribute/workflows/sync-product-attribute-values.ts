import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";

import { AttributeSource } from "@mercurjs/framework";

import { createAndLinkAttributeValuesWorkflow } from "./create-and-link-attribute-values";
import { deleteAttributeValueWorkflow } from "./delete-attribute-value";

export const syncProductAttributeValuesWorkflowId =
  "sync-product-attribute-values";

type ExistingAttributeValue = {
  attribute_value_id: string;
  value: string;
};

type SyncProductAttributeValuesWorkflowInput = {
  product_id: string;
  seller_id: string;
  attribute_id: string;
  attribute_source: AttributeSource;
  possible_values: string[];
  new_values: string[];
  existing_values: ExistingAttributeValue[];
};

export const syncProductAttributeValuesWorkflow = createWorkflow(
  syncProductAttributeValuesWorkflowId,
  (input: SyncProductAttributeValuesWorkflowInput) => {
    const diff = transform({ input }, ({ input }) => {
      const existingByValue = new Map(
        input.existing_values.map((value) => [value.value, value.attribute_value_id])
      );
      const newValueSet = new Set(input.new_values);

      const toRemove = input.existing_values
        .filter((value) => !newValueSet.has(value.value))
        .map((value) => value.attribute_value_id);

      const allowedValues = new Set(input.possible_values);
      const toAddAdmin: string[] = [];
      const toAddVendor: string[] = [];

      for (const value of input.new_values) {
        if (existingByValue.has(value)) {
          continue;
        }

        const isAdminValue =
          input.attribute_source === AttributeSource.ADMIN &&
          (allowedValues.size === 0 || allowedValues.has(value));

        if (isAdminValue) {
          toAddAdmin.push(value);
        } else {
          toAddVendor.push(value);
        }
      }

      return {
        toRemove,
        toAdd: [
          ...toAddAdmin.map((value) => ({
            value,
            source: AttributeSource.ADMIN,
          })),
          ...toAddVendor.map((value) => ({
            value,
            source: AttributeSource.VENDOR,
          })),
        ],
      };
    });

    when({ diff }, ({ diff }) => diff.toRemove.length > 0).then(() => {
      deleteAttributeValueWorkflow.runAsStep({
        input: diff.toRemove,
      });
    });

    const createdValues = createAndLinkAttributeValuesWorkflow.runAsStep({
      input: {
        product_id: input.product_id,
        attribute_id: input.attribute_id,
        seller_id: input.seller_id,
        values: diff.toAdd,
      },
    });

    return new WorkflowResponse({
      removed_values_count: diff.toRemove.length,
      created_values_count: createdValues.ids.length,
    });
  }
);
