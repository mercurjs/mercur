import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import { CreateRequestDTO } from '@mercurjs/framework';

import {
  REQUESTS_MODULE,
  RequestsModuleService
} from '../../../modules/requests';

export const createRequestStep = createStep(
  'create-request',
  async (input: CreateRequestDTO | CreateRequestDTO[], { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    const toCreate = Array.isArray(input) ? input : [input];

    const requests = await service.createRequests(toCreate);

    const createdIds = requests.map((r) => r.id);

    return new StepResponse(requests, createdIds);
  },
  async (createdIds: string[], { container }) => {
    if (!createdIds?.length) {
      return;
    }

    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    await service.deleteRequests(createdIds);
  }
);
