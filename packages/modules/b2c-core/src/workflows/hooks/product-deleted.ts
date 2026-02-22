import { Modules } from "@medusajs/framework/utils";
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows";

import { AlgoliaEvents, ProductRequestUpdatedEvent } from "@mercurjs/framework";
import { syncSellersPromotionsDefaultProductRuleValues } from "../promotions/utils/sync-seller-product-rule-values";

deleteProductsWorkflow.hooks.productsDeleted(async ({ ids }, { container }) => {
  await syncSellersPromotionsDefaultProductRuleValues(container, ids, "remove");

  await container.resolve(Modules.EVENT_BUS).emit([{
      name: AlgoliaEvents.PRODUCTS_DELETED,
      data: { ids }
    },
    {
      name: ProductRequestUpdatedEvent.DELETED,
      data: { ids }
    }
  ]);
});
