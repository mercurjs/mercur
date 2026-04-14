import { model } from "@medusajs/framework/utils";
import { RejectionReasonType } from "@mercurjs/types";
import ProductChange from "./product-change";

const ProductRejectionReason = model
  .define("ProductRejectionReason", {
    id: model.id({ prefix: "prejr" }).primaryKey(),
    code: model.text(),
    label: model.text().searchable(),
    type: model.enum(RejectionReasonType),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
    product_changes: model.manyToMany(() => ProductChange, {
      mappedBy: "rejection_reasons",
    }),
  })
  .indexes([
    {
      name: "IDX_product_rejection_reason_code_unique",
      on: ["code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_product_rejection_reason_type",
      on: ["type"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ]);

export default ProductRejectionReason;
