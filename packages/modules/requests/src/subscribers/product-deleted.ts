import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { ProductWorkflowEvents } from '@medusajs/framework/utils';

import { REQUESTS_MODULE, RequestsModuleService } from '../modules/requests';

export default async function productDeletedHandler({
  event,
  container
}: SubscriberArgs<{ id: string }>) {
  const requestService =
    container.resolve<RequestsModuleService>(REQUESTS_MODULE);

  const foundRequests = await requestService.listRequests({
    $or: [
      {
        data: {
          product_id: event.data.id
        },
        status: 'pending'
      },
      {
        data: {
          id: event.data.id
        },
        status: 'pending'
      }
    ]
  });

  await requestService.softDeleteRequests(
    foundRequests.map((request) => request.id)
  );
}

export const config: SubscriberConfig = {
  event: ProductWorkflowEvents.DELETED,
  context: {
    subscriberId: 'product-deleted-handler'
  }
};
