import { model } from "@medusajs/framework/utils";
import { ProductChangeStatus } from "@mercurjs/types";
import Product from "./product";
import ProductChangeAction from "./product-change-action";

const ProductChange = model
  .define("ProductChange", {
    id: model.id({ prefix: "prodch" }).primaryKey(),
    product: model.belongsTo(() => Product, { mappedBy: "changes" }),
    status: model
      .enum(ProductChangeStatus)
      .default(ProductChangeStatus.PENDING),
    internal_note: model.text().nullable(),
    external_note: model.text().nullable(),
    created_by: model.text().nullable(),
    confirmed_by: model.text().nullable(),
    confirmed_at: model.dateTime().nullable(),
    declined_by: model.text().nullable(),
    declined_at: model.dateTime().nullable(),
    declined_reason: model.text().nullable(),
    canceled_by: model.text().nullable(),
    canceled_at: model.dateTime().nullable(),
    metadata: model.json().nullable(),
    actions: model.hasMany(() => ProductChangeAction, {
      mappedBy: "product_change",
    }),
  })
  .cascades({
    delete: ["actions"],
  })
  .indexes([
    {
      name: "IDX_product_change_product_id",
      on: ["product_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_change_status",
      on: ["status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductChange;
