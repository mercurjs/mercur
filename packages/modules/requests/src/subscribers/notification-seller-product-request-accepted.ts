import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import {
  checkConfigurationRule,
  ConfigurationRuleType,
  ProductRequestUpdatedEvent,
} from "@mercurjs/framework";
import { sendVendorUIRequestNotification } from "../modules/requests";

export default async function sellerProductRequestAcceptedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  if (
    !checkConfigurationRule(
      container,
      ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
    )
  ) {
    return;
  }

  const {
    data: [productRequest],
  } = await query.graph({
    entity: "request",
    fields: ["*"],
    filters: {
      id: event.data.id,
    },
  });

  if (!productRequest || productRequest.type !== "product") {
    return;
  }

  const {
    data: [member],
  } = await query.graph({
    entity: "member",
    fields: ["*"],
    filters: {
      id: productRequest.submitter_id,
    },
  });

  if (!member || !member.email) {
    return;
  }

  await sendVendorUIRequestNotification({
    container,
    requestId: event.data.id,
    requestType: "product",
    template: "seller_product_request_accepted_notification",
  });
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.ACCEPTED,
  context: {
    subscriberId: "seller-product-request-accepted-handler",
  },
};
