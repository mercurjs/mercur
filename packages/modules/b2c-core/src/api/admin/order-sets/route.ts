import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { Knex } from "@mikro-orm/postgresql";

import orderSetOrder from "../../../links/order-set-order";
import sellerOrder from "../../../links/seller-order";
import { getFormattedOrderSetListWorkflow } from "../../../workflows/order-set/workflows";
import {
  createEmptyResponse,
  intersectOrSetFilter,
  OrderSetFilterHelper,
} from "./helpers";

/**
 * @oas [get] /admin/order-sets
 * operationId: "AdminListOrderSets"
 * summary: "List Order Sets"
 * description: "Retrieves a list of order sets with optional filtering and search."
 * x-authenticated: true
 * parameters:
 *   - name: offset
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to skip before starting to collect the result set.
 *   - name: limit
 *     in: query
 *     schema:
 *       type: number
 *     required: false
 *     description: The number of items to return.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 *   - name: order_id
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Filter order sets by a specific order ID.
 *   - name: q
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Search query to filter order sets by Vendor name, Customer email/name, Group ID (display_id), or Order ID.
 *   - name: seller_id
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by seller ID(s).
 *   - name: payment_status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by payment status(es).
 *   - name: fulfillment_status
 *     in: query
 *     schema:
 *       oneOf:
 *         - type: string
 *         - type: array
 *           items:
 *             type: string
 *     required: false
 *     description: Filter order sets by fulfillment status(es).
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             order_sets:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/AdminOrderSet"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Admin Order Sets
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { filterableFields, queryConfig } = req;

  const knex = req.scope.resolve(
    ContainerRegistrationKeys.PG_CONNECTION
  ) as Knex;
  const filterHelper = new OrderSetFilterHelper(
    knex,
    query,
    orderSetOrder.entryPoint,
    sellerOrder.entryPoint
  );

  if (filterableFields["order_id"]) {
    const orderSetId = await filterHelper.handleOrderIdFilter(
      filterableFields["order_id"] as string
    );
    delete filterableFields["order_id"];

    if (!orderSetId) {
      return res.json(createEmptyResponse(queryConfig.pagination));
    }

    filterableFields["id"] = orderSetId;
  }

  if (filterableFields["q"]) {
    const searchQuery = filterableFields["q"] as string;
    delete filterableFields["q"];

    const matchingIds = await filterHelper.handleSearchFilter(searchQuery);

    if (matchingIds.length === 0) {
      return res.json(createEmptyResponse(queryConfig.pagination));
    }

    intersectOrSetFilter(filterableFields, matchingIds);
  }

  if (filterableFields["seller_id"]) {
    const sellerIds = Array.isArray(filterableFields["seller_id"])
      ? filterableFields["seller_id"]
      : [filterableFields["seller_id"]];
    delete filterableFields["seller_id"];

    const matchingIds = await filterHelper.handleSellerFilter(sellerIds);

    if (matchingIds.length === 0) {
      return res.json(createEmptyResponse(queryConfig.pagination));
    }

    intersectOrSetFilter(filterableFields, matchingIds);
  }

  if (filterableFields["payment_status"]) {
    const paymentStatuses = Array.isArray(filterableFields["payment_status"])
      ? filterableFields["payment_status"]
      : [filterableFields["payment_status"]];
    delete filterableFields["payment_status"];

    const matchingIds =
      await filterHelper.handlePaymentStatusFilter(paymentStatuses);

    if (matchingIds.length === 0) {
      return res.json(createEmptyResponse(queryConfig.pagination));
    }

    intersectOrSetFilter(filterableFields, matchingIds);
  }

  if (filterableFields["fulfillment_status"]) {
    const statusArray = Array.isArray(filterableFields["fulfillment_status"])
      ? filterableFields["fulfillment_status"]
      : [filterableFields["fulfillment_status"]];
    delete filterableFields["fulfillment_status"];

    const matchingIds =
      await filterHelper.handleFulfillmentStatusFilter(statusArray);

    if (matchingIds.length === 0) {
      return res.json(createEmptyResponse(queryConfig.pagination));
    }

    intersectOrSetFilter(filterableFields, matchingIds);
  }

  const {
    result: { data, metadata },
  } = await getFormattedOrderSetListWorkflow(req.scope).run({
    input: {
      fields: queryConfig.fields,
      filters: filterableFields,
      pagination: queryConfig.pagination,
    },
  });

  res.json({
    order_sets: data,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
