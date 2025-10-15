import { model } from "@medusajs/framework/utils";

import { OrderReturnRequest } from "./return-request";

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
