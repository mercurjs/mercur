import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import {
  REQUESTS_MODULE,
  RequestsModuleService
} from '../../../modules/requests';

type DeleteRequestsStepInput = {
  ids: string[];
};

export const deleteRequestsStep = createStep(
  'delete-requests',
  async (input: DeleteRequestsStepInput, { container }) => {
    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    const requests = await service.listRequests({
      id: input.ids
    });

    await service.softDeleteRequests(input.ids);

    return new StepResponse(input.ids, requests);
  },
  async (deletedRequests, { container }) => {
    if (!deletedRequests?.length) {
      return;
    }

    const service = container.resolve<RequestsModuleService>(REQUESTS_MODULE);

    await service.createRequests(
      deletedRequests.map((req) => ({
        id: req.id,
        type: req.type,
        data: req.data,
        submitter_id: req.submitter_id,
        reviewer_id: req.reviewer_id,
        reviewer_note: req.reviewer_note,
        status: req.status
      }))
    );
  }
);
