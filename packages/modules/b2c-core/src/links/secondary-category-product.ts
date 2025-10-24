import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import SecondaryCategoryModule from "../modules/secondary_categories";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: SecondaryCategoryModule.linkable.secondaryCategory,
    isList: true,
  }
);
