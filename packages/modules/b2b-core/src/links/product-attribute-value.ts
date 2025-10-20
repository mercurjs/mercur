import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import AttributeModule from "../modules/attribute";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: AttributeModule.linkable.attributeValue,
    isList: true,
  }
);
