import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import CategoryDetailsModule from "../modules/category-details";

export default defineLink(
  {
    linkable: ProductModule.linkable.productCategory,
  },
  {
    linkable: CategoryDetailsModule.linkable.categoryDetail,
    deleteCascade: true,
  },
  { database: { table: 'category_category_detail' } }
);

