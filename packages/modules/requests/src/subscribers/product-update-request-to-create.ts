import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  checkConfigurationRule,
  ConfigurationRuleType,
  CreateRequestDTO,
  ProductUpdateRequestUpdatedEvent,
} from "@mercurjs/framework";
import { createProductUpdateRequestWorkflow } from "../workflows/requests/workflows/create-product-update-request";

export default async function productUpdateRequestToCreateHandler({
  event,
  container,
}: SubscriberArgs<{
  data: CreateRequestDTO;
  seller_id: string;
  additional_data?: any;
}>) {
  const input = event.data;

  if (
    await checkConfigurationRule(
      container,
      ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
    )
  ) {
    console.log("Creating product update request to create");
    await createProductUpdateRequestWorkflow.run({
      container,
      input,
    });
  } else {
    console.log("Not creating product update request to create");
  }
}

export const config: SubscriberConfig = {
  event: ProductUpdateRequestUpdatedEvent.TO_CREATE,
  context: {
    subscriberId: "product-update-request-to-create",
  },
};
