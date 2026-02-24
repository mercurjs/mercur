import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework';
import { InferTypeOf } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils';

import { fetchSellerByAuthActorId } from '@mercurjs/framework';

import sellerRequest from '../../../../links/seller-request';
import { Request } from '../../../../modules/requests/models';
import {
  createRequestWorkflow,
  deleteRequestsWorkflow,
  updateRequestDataWorkflow
} from '../../../../workflows/requests/workflows';
import { VendorBatchRequestsType } from '../validators';

type RequestDTO = InferTypeOf<typeof Request>;

async function validateRequestOwnership(
  query: {
    graph: (config: Record<string, unknown>) => Promise<{ data: unknown[] }>;
  },
  sellerId: string,
  requestIds: string[]
): Promise<void> {
  if (requestIds.length === 0) {
    return;
  }

  const { data: ownedRequests } = await query.graph({
    entity: sellerRequest.entryPoint,
    fields: ['request_id'],
    filters: {
      request_id: requestIds,
      seller_id: sellerId
    }
  });

  const ownedRequestIds = ownedRequests.map(
    (r: { request_id: string }) => r.request_id
  );
  const notOwnedIds = requestIds.filter((id) => !ownedRequestIds.includes(id));

  if (notOwnedIds.length > 0) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `You are not allowed to modify requests: ${notOwnedIds.join(', ')}`
    );
  }
}

/**
 * @oas [post] /vendor/requests/batch
 * operationId: "VendorBatchRequests"
 * summary: "Batch create/update/delete requests"
 * description: "Batch operations for requests. All operations succeed or all fail."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorBatchRequests"
 * responses:
 *   "200":
 *     description: Ok
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             created:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorRequest"
 *             updated:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorRequest"
 *             deleted:
 *               type: array
 *               items:
 *                 type: string
 * tags:
 *   - Vendor Requests
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorBatchRequestsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  );

  const {
    create = [],
    update = [],
    delete: deleteIds = []
  } = req.validatedBody;

  const updateIds = update.map((item) => item.id);
  await validateRequestOwnership(query, seller.id, [
    ...updateIds,
    ...deleteIds
  ]);

  const createPromises = create.map((item) =>
    createRequestWorkflow.run({
      container: req.scope,
      input: {
        data: {
          submitter_id: req.auth_context.actor_id,
          ...item.request
        },
        seller_id: seller.id
      }
    })
  );

  const updatePromises = update.map((item) =>
    updateRequestDataWorkflow.run({
      container: req.scope,
      input: {
        id: item.id,
        ...item.request
      }
    })
  );

  const [createResults] = await Promise.all([
    Promise.all(createPromises),
    Promise.all(updatePromises)
  ]);

  let deletedRequestIds: string[] = [];
  if (deleteIds.length > 0) {
    const deleteResult = await deleteRequestsWorkflow.run({
      container: req.scope,
      input: { ids: deleteIds }
    });
    deletedRequestIds = deleteResult.result;
  }

  const createdRequests: RequestDTO[] = createResults.map(
    ({ result }) => result[0]
  );

  let updatedRequests: RequestDTO[] = [];
  if (updateIds.length > 0) {
    const { data: fetchedRequests } = await query.graph({
      entity: 'request',
      fields: ['*'],
      filters: {
        id: updateIds
      }
    });
    updatedRequests = fetchedRequests as RequestDTO[];
  }

  res.json({
    created: createdRequests,
    updated: updatedRequests,
    deleted: deletedRequestIds
  });
};
