import { model } from "@medusajs/framework/utils";

import { AttributeUIComponent } from "@mercurjs/framework";

const VendorProductAttribute = model
  .define("vendor_product_attribute", {
    id: model.id({ prefix: "vnd_prod_attr" }).primaryKey(),
    name: model.text(),
    value: model.text(),
    ui_component: model
      .enum(Object.values(AttributeUIComponent))
      .default(AttributeUIComponent.TEXTAREA),
    extends_attribute_id: model.text().nullable(),
    rank: model.number().default(0),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["name"],
      name: "IDX_vendor_product_attribute_name",
    },
  ]);

export default VendorProductAttribute;
