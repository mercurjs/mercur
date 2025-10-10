import { model } from "@medusajs/framework/utils";

import { AttributeUIComponent } from "@mercurjs/framework";
import AttributePossibleValue from "./attribute-possible-value";
import AttributeValue from "./attribute-value";

const Attribute = model
  .define("attribute", {
    id: model.id({ prefix: "attr" }).primaryKey(),
    name: model.text().searchable(),
    description: model.text().nullable(),
    is_required: model.boolean().default(false),
    is_filterable: model.boolean().default(true),
    handle: model.text().unique(),
    metadata: model.json().nullable(),
    ui_component: model
      .enum(Object.values(AttributeUIComponent))
      .default(AttributeUIComponent.SELECT),
    values: model.hasMany(() => AttributeValue),
    possible_values: model.hasMany(() => AttributePossibleValue),
  })
  .cascades({
    delete: ["values", "possible_values"],
  });

export default Attribute;
