import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import CollectionDetailsModule from "../modules/collection-details";

export default defineLink(
  {
    linkable: ProductModule.linkable.productCollection,
  },
  {
    linkable: CollectionDetailsModule.linkable.collectionDetail,
    deleteCascade: true,
  },
  { database: { table: 'collection_collection_detail' } }
);
