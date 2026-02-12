import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import { ATTRIBUTE_MODULE } from "../../../modules/attribute";
import { SELLER_MODULE } from "../../../modules/seller";

import productAttributeValue from "../../../links/product-attribute-value";
import sellerAttributeValueLink from "../../../links/seller-attribute-value";
import { deleteAttributeValueStep } from "../steps";

export const deleteAttributeValueWorkflowId = "delete-attribute-value";

export type DeleteAttributeValueWorkflowInput = string | string[];

export const deleteAttributeValueWorkflow = createWorkflow(
  deleteAttributeValueWorkflowId,
  (input: DeleteAttributeValueWorkflowInput) => {
    const normalizedInput = transform({ input }, ({ input }) =>
      Array.isArray(input) ? input : [input]
    );

    const attributeValueProductQuery = useQueryGraphStep({
      entity: productAttributeValue.entryPoint,
      fields: ["product_id", "attribute_value_id"],
      filters: {
        attribute_value_id: normalizedInput,
      },
    }).config({ name: "attribute-value-product-query" });

    const attributeValueSellerQuery = useQueryGraphStep({
      entity: sellerAttributeValueLink.entryPoint,
      fields: ["seller_id", "attribute_value_id"],
      filters: {
        attribute_value_id: normalizedInput,
      },
    }).config({ name: "attribute-value-seller-query" });

    const deleted = deleteAttributeValueStep(normalizedInput);

    const productLinks = transform(
      { attributeValueProductQuery },
      ({ attributeValueProductQuery }) => {
        const { data } = attributeValueProductQuery;
        return data.map((element) => ({
          [Modules.PRODUCT]: {
            product_id: element.product_id,
          },
          [ATTRIBUTE_MODULE]: {
            attribute_value_id: element.attribute_value_id,
          },
        }));
      }
    );

    const sellerLinks = transform(
      { attributeValueSellerQuery },
      ({ attributeValueSellerQuery }) => {
        const { data } = attributeValueSellerQuery;
        return data.map((element) => ({
          [SELLER_MODULE]: {
            seller_id: element.seller_id,
          },
          [ATTRIBUTE_MODULE]: {
            attribute_value_id: element.attribute_value_id,
          },
        }));
      }
    );

    const linksToDismiss = transform(
      { productLinks, sellerLinks },
      ({ productLinks, sellerLinks }) => [...productLinks, ...sellerLinks]
    );

    dismissRemoteLinkStep(linksToDismiss);

    return new WorkflowResponse(deleted);
  }
);
