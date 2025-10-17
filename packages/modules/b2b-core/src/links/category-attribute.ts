import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import AttributeModule from "../modules/attribute";

export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
    isList: true,
  },
  {
    linkable: AttributeModule.linkable.attribute,
    isList: true,
  }
);
