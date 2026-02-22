import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import {
  checkConfigurationRule,
  ConfigurationRuleType,
  ProductRequestUpdatedEvent,
} from "@mercurjs/framework";
import { REQUESTS_MODULE, RequestsModuleService } from "../modules/requests";

import { acceptProductRequestWorkflow } from "../workflows/requests/workflows";

export default async function productRequestCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const { id } = event.data;
  const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const request = await service.retrieveRequest(id);

  if (
    request.status !== "draft" &&
    !(await checkConfigurationRule(
      container,
      ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL
    ))
  ) {
    logger.info(`${request.id}: Request automatically accepted`);
    await acceptProductRequestWorkflow.run({
      container,
      input: {
        data: request.data,
        id: request.id,
        reviewer_id: "system",
        reviewer_note: "auto accepted",
        status: "accepted",
      },
    });
  }
}

export const config: SubscriberConfig = {
  event: ProductRequestUpdatedEvent.CREATED,
  context: {
    subscriberId: "product-request-created",
  },
};
