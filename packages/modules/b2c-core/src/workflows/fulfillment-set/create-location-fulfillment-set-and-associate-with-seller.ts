import { Modules } from "@medusajs/framework/utils";
import { transform } from "@medusajs/framework/workflows-sdk";
import {
  createFulfillmentSets,
  createRemoteLinkStep,
} from "@medusajs/medusa/core-flows";
import { createWorkflow } from "@medusajs/workflows-sdk";

import { SELLER_MODULE } from "../../modules/seller";

type CreateFulfillmentSetAndAssociateWithSellerInput = {
  location_id: string;
  fulfillment_set_data: {
    name: string;
    type: string;
  };
  seller_id: string;
};

export const createLocationFulfillmentSetAndAssociateWithSellerWorkflow =
  createWorkflow(
    "create-fulfillment-set-and-associate-with-seller",
    function (input: CreateFulfillmentSetAndAssociateWithSellerInput) {
      const fulfillmentSet = createFulfillmentSets([
        {
          name: input.fulfillment_set_data.name,
          type: input.fulfillment_set_data.type,
        },
      ]);

      const fullfillmentSetId = transform(fulfillmentSet, (data) => data[0].id);

      createRemoteLinkStep([
        {
          [Modules.STOCK_LOCATION]: {
            stock_location_id: input.location_id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: fullfillmentSetId,
          },
        },
        {
          [SELLER_MODULE]: {
            seller_id: input.seller_id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: fullfillmentSetId,
          },
        },
      ]);
    }
  );
