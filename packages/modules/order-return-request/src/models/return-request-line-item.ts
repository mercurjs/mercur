import { model } from "@medusajs/framework/utils";

import { OrderReturnRequest } from "./return-request";

/**
 * @class OrderReturnRequestLineItem
 * @description Represents a line item in an order return request.
 *
 * This model defines the structure for storing line item information in an order return request.
 * Each line item is associated with a specific return request and can have a quantity.
 */
export const OrderReturnRequestLineItem = model.define(
  "order_return_request_line_item",
  {
    id: model.id({ prefix: "oretreqli" }).primaryKey(),
    line_item_id: model.text(),
    quantity: model.number(),
    reason_id: model.text().nullable(),
    return_request: model.belongsTo(() => OrderReturnRequest, {
      mappedBy: "line_items",
    }),
  }
);
