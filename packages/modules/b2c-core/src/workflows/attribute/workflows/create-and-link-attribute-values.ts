import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";

import { AttributeSource } from "@mercurjs/framework";

import { ATTRIBUTE_MODULE } from "../../../modules/attribute";
import { SELLER_MODULE } from "../../../modules/seller";
import { createAttributeValuesStep } from "../steps/create-attribute-values";

export const createAndLinkAttributeValuesWorkflowId =
  "create-and-link-attribute-values";

export type CreateAndLinkAttributeValuesWorkflowInput = {
  product_id: string;
  attribute_id: string;
  values: {
    value: string;
    source: AttributeSource;
  }[];
  seller_id?: string;
};

export const createAndLinkAttributeValuesWorkflow = createWorkflow(
  createAndLinkAttributeValuesWorkflowId,
  (input: CreateAndLinkAttributeValuesWorkflowInput) => {
    const valuesBySource = transform({ input }, ({ input }) => {
      const adminValues: string[] = [];
      const vendorValues: string[] = [];

      for (const entry of input.values) {
        if (entry.source === AttributeSource.ADMIN) {
          adminValues.push(entry.value);
        } else {
          vendorValues.push(entry.value);
        }
      }

      return {
        adminValues,
        vendorValues,
      };
    });

    const createdAdminValues = createAttributeValuesStep({
      attribute_id: input.attribute_id,
      values: valuesBySource.adminValues,
      source: AttributeSource.ADMIN,
    }).config({ name: "create-admin-attribute-values" });

    const createdVendorValues = createAttributeValuesStep({
      attribute_id: input.attribute_id,
      values: valuesBySource.vendorValues,
      source: AttributeSource.VENDOR,
    }).config({ name: "create-vendor-attribute-values" });

    const createdAttributeValueIds = transform(
      { createdAdminValues, createdVendorValues },
      ({ createdAdminValues, createdVendorValues }) => [
        ...createdAdminValues.ids,
        ...createdVendorValues.ids,
      ]
    );

    const productLinks = transform(
      { input, createdAttributeValueIds },
      ({ input, createdAttributeValueIds }) =>
        createdAttributeValueIds.map((attribute_value_id) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id },
        }))
    );

    when({ productLinks }, ({ productLinks }) => productLinks.length > 0).then(
      () => {
        createRemoteLinkStep(productLinks).config({
          name: "create-product-attribute-value-links",
        });
      }
    );

    const sellerLinks = transform(
      { input, createdVendorValues },
      ({ input, createdVendorValues }) => {
        if (!input.seller_id) {
          return [];
        }

        return createdVendorValues.ids.map((attribute_value_id) => ({
          [SELLER_MODULE]: { seller_id: input.seller_id! },
          [ATTRIBUTE_MODULE]: { attribute_value_id },
        }));
      }
    );

    when({ sellerLinks }, ({ sellerLinks }) => sellerLinks.length > 0).then(
      () => {
        createRemoteLinkStep(sellerLinks).config({
          name: "create-seller-attribute-value-links",
        });
      }
    );

    return new WorkflowResponse({
      ids: createdAttributeValueIds,
      vendor_ids: createdVendorValues.ids,
      admin_ids: createdAdminValues.ids,
    });
  }
);
