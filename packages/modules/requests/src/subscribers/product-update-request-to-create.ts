import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
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

  await createProductUpdateRequestWorkflow.run({
    container,
    input,
  });
}

export const config: SubscriberConfig = {
  event: ProductUpdateRequestUpdatedEvent.TO_CREATE,
  context: {
    subscriberId: "product-update-request-to-create",
  },
};
