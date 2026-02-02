import { defineLink, model } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";

import FeaturedCollectionModule from "../modules/featured_collection";

export default defineLink(
    {
        linkable: ProductModule.linkable.product,
        isList: true,
    },
    {
        linkable: FeaturedCollectionModule.linkable.featuredCollection,
        isList: true,
    },
    {
        database: {
            table: "featured_collection_product", extraColumns: {
                position: { type: "integer", nullable: false },

            }
        }
    }
);
