import { model } from "@medusajs/framework/utils";

export const FeaturedCollection = model.define("featured_collection", {
    id: model.id({ prefix: "feat_col" }).primaryKey(),
    name: model.text().searchable(),
    handle: model.text().unique(),
    min_items: model.number().default(4),
    max_items: model.number().default(8),
    is_active: model.boolean().default(false),
});
