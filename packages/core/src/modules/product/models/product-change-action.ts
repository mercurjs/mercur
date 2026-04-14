import { model } from "@medusajs/framework/utils";
import ProductChange from "./product-change";

const ProductChangeAction = model
  .define("ProductChangeAction", {
    id: model.id({ prefix: "prodchact" }).primaryKey(),
    product_id: model.text(),
    ordering: model.autoincrement(),
    action: model.text(),
    details: model.json().default({}),
    internal_note: model.text().nullable(),
    applied: model.boolean().default(false),
    product_change: model
      .belongsTo(() => ProductChange, { mappedBy: "actions" })
      .nullable(),
  })
  .indexes([
    {
      name: "IDX_prodchact_product_change_id",
      on: ["product_change_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_prodchact_product_id",
      on: ["product_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_prodchact_ordering",
      on: ["ordering"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductChangeAction;
