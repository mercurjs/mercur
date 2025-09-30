import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";

import sellerReturnRequest from "../../../links/seller-return-request";

import { vendorReturnOrderRequestQueryConfig } from "./query-config";
import {
  VendorGetOrderReturnRequestParams,
  VendorUpdateOrderReturnRequest,
} from "./validators";
import {
  filterBySellerId,
  checkResourceOwnershipByResourceId,
} from "@mercurjs/framework";

export const vendorReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/return-request",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderReturnRequestParams,
        vendorReturnOrderRequestQueryConfig.list
      ),
      filterBySellerId(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/return-request/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderReturnRequestParams,
        vendorReturnOrderRequestQueryConfig.retrieve
      ),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturnRequest.entryPoint,
        filterField: "order_return_request_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/return-request/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetOrderReturnRequestParams,
        vendorReturnOrderRequestQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorUpdateOrderReturnRequest),
      checkResourceOwnershipByResourceId({
        entryPoint: sellerReturnRequest.entryPoint,
        filterField: "order_return_request_id",
      }),
    ],
  },
];
