import { model } from "@medusajs/framework/utils";

export const SecondaryCategory = model.define("secondary_category", {
  id: model.id({ prefix: "sec_cat" }).primaryKey(),
  category_id: model.text(),
});
