import { Modules } from "@medusajs/framework/utils";
import {
  createCustomerGroupsWorkflow,
  createRemoteLinkStep,
} from "@medusajs/medusa/core-flows";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";

import { SELLER_MODULE } from "../../../modules/seller";

type WorkflowInput = {
  name: string;
  created_by: string;
  seller_id: string;
};
export const createSellerCustomerGroupWorkflow = createWorkflow(
  "create-seller-customer-group",
  function (input: WorkflowInput) {
    const group = createCustomerGroupsWorkflow.runAsStep({
      input: {
        customersData: [input],
      },
    });

    const links = transform({ group, input }, ({ group, input }) => {
      return [
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id,
          },
          [Modules.CUSTOMER]: {
            customer_group_id: group[0].id,
          },
        },
      ];
    });

    createRemoteLinkStep(links);

    return new WorkflowResponse(group[0]);
  }
);
