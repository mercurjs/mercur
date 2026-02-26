import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createProductOptionsWorkflow,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";

import { ATTRIBUTE_MODULE } from "../../../modules/attribute";
import { SELLER_MODULE } from "../../../modules/seller";
import sellerAttributeValueLink from "../../../links/seller-attribute-value";
import { deleteAttributeValueWorkflow } from "./delete-attribute-value";

export const convertAttributeToOptionWorkflowId = "convert-attribute-to-option";

type ConvertAttributeToOptionWorkflowInput = {
  product_id: string;
  seller_id: string;
  option_title: string;
  option_values: string[];
  attribute_value_ids: string[];
};

export const convertAttributeToOptionWorkflow = createWorkflow(
  convertAttributeToOptionWorkflowId,
  (input: ConvertAttributeToOptionWorkflowInput) => {
    const createdOptions = createProductOptionsWorkflow.runAsStep({
      input: {
        product_options: [
          {
            product_id: input.product_id,
            title: input.option_title,
            values: input.option_values,
          },
        ],
      },
    });

    const sellerAttributeValueLinks = useQueryGraphStep({
      entity: sellerAttributeValueLink.entryPoint,
      fields: ["attribute_value_id"],
      filters: {
        seller_id: input.seller_id,
        attribute_value_id: input.attribute_value_ids,
      },
    });

    const linksToDismiss = transform(
      { sellerAttributeValueLinks, input },
      ({ sellerAttributeValueLinks, input }) =>
        sellerAttributeValueLinks.data.map(({ attribute_value_id }) => ({
          [SELLER_MODULE]: { seller_id: input.seller_id },
          [ATTRIBUTE_MODULE]: { attribute_value_id },
        }))
    );

    dismissRemoteLinkStep(linksToDismiss);

    deleteAttributeValueWorkflow.runAsStep({
      input: input.attribute_value_ids,
    });

    return new WorkflowResponse({
      options: createdOptions,
    });
  }
);
