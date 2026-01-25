import { MedusaContainer } from "@medusajs/framework";
import { PromotionTypes } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  deduplicate,
} from "@medusajs/framework/utils";

import sellerProduct from "../../../links/seller-product";
import sellerPromotion from "../../../links/seller-promotion";
import { SELLER_PRODUCTS_RULE_DESCRIPTION } from "../steps/inject-seller-product-rule";

const TARGET_RULE_FIELDS = [
  "id",
  "application_method.target_rules.*",
  "application_method.target_rules.id",
  "application_method.target_rules.description",
  "application_method.target_rules.attribute",
  "application_method.target_rules.values",
  "application_method.target_rules.values.id",
  "application_method.target_rules.values.value",
];

type BuildRuleUpdatesOptions = {
  sellerProductsByPromotion?: Map<string, string[]>;
};

const buildRuleUpdates = (
  promotions: PromotionTypes.PromotionDTO[],
  productIds: string[],
  action: "add" | "remove",
  options: BuildRuleUpdatesOptions = {}
) => {
  const updates: PromotionTypes.UpdatePromotionRuleDTO[] = [];

  for (const promotion of promotions) {
    const rules =
      promotion.application_method?.target_rules?.filter((r) =>
        action === "add"
          ? r.description === SELLER_PRODUCTS_RULE_DESCRIPTION
          : r.attribute === "items.product.id"
      ) || [];

    for (const rule of rules) {
      const existingValues = (rule.values || []).map((v) => v.value as string);
      let nextValues =
        action === "add"
          ? deduplicate([...existingValues, ...productIds])
          : existingValues.filter((value) => !productIds.includes(value));

      if (action === "remove" && nextValues.length === 0) {
        const fallbackValues =
          options.sellerProductsByPromotion?.get(promotion.id || "") || [];
        if (fallbackValues.length) {
          nextValues = deduplicate(fallbackValues);
        }
      }

      const changed =
        existingValues.length !== nextValues.length ||
        existingValues.some((v) => !nextValues.includes(v));

      if (!changed) {
        continue;
      }

      updates.push({
        id: rule.id,
        values: nextValues,
      });
    }
  }

  return updates;
};

export const syncSellersPromotionsDefaultProductRuleValues = async (
  container: MedusaContainer,
  productIds: string[],
  action: "add" | "remove"
) => {
  if (!productIds.length) {
    return;
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const promotionModule =
    container.resolve<PromotionTypes.IPromotionModuleService>(
      Modules.PROMOTION
    );
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  switch (action) {
    case "remove": {
      const { data: promotions } = await query.graph({
        entity: "promotion",
        fields: TARGET_RULE_FIELDS,
        filters: {
          application_method: {
            target_rules: {
              values: { value: productIds },
            },
          },
        },
      });

      const promotionIds = (promotions as PromotionTypes.PromotionDTO[])
        .map((p) => p.id)
        .filter(Boolean);

      const { data: sellerPromotions } = promotionIds.length
        ? await query.graph({
            entity: sellerPromotion.entryPoint,
            fields: ["promotion_id", "seller_id", "promotion.id"],
            filters: { promotion_id: promotionIds },
          })
        : { data: [] };

      const promotionSellerMap = new Map<string, string>();
      for (const sp of sellerPromotions) {
        if (sp.promotion_id && sp.seller_id && !promotionSellerMap.has(sp.promotion_id)) {
          promotionSellerMap.set(sp.promotion_id, sp.seller_id);
        }
      }

      const sellerIds = Array.from(new Set(promotionSellerMap.values()));

      const { data: sellerProducts } = sellerIds.length
        ? await query.graph({
            entity: sellerProduct.entryPoint,
            fields: ["product_id", "seller_id"],
            filters: { seller_id: sellerIds },
          })
        : { data: [] };

      const sellerProductsBySeller = new Map<string, string[]>();
      for (const sp of sellerProducts) {
        if (!sp.seller_id || !sp.product_id) {
          continue;
        }
        if (productIds.includes(sp.product_id)) {
          continue;
        }
        const list = sellerProductsBySeller.get(sp.seller_id) ?? [];
        list.push(sp.product_id);
        sellerProductsBySeller.set(sp.seller_id, list);
      }

      const sellerProductsByPromotion = new Map<string, string[]>();
      for (const [promotionId, sellerId] of promotionSellerMap.entries()) {
        const products = sellerProductsBySeller.get(sellerId);
        if (products?.length) {
          sellerProductsByPromotion.set(promotionId, deduplicate(products));
        }
      }

      const updates = buildRuleUpdates(
        promotions as PromotionTypes.PromotionDTO[],
        productIds,
        "remove",
        { sellerProductsByPromotion }
      );

      if (updates.length) {
        await promotionModule.updatePromotionRules(updates);
      }

      return;
    }
    case "add": {
      const productsBySeller = new Map<string, string[]>();

      const { data: sellerProducts } = await query.graph({
        entity: sellerProduct.entryPoint,
        fields: ["product_id", "seller_id"],
        filters: { product_id: productIds },
      });

      for (const sp of sellerProducts) {
        const list = productsBySeller.get(sp.seller_id) ?? [];
        list.push(sp.product_id);
        productsBySeller.set(sp.seller_id, list);
      }

      if (!productsBySeller.size) {
        return;
      }

      for (const [seller, sellerProductIds] of productsBySeller.entries()) {
        const { data: sellerPromotions } = await query.graph({
          entity: sellerPromotion.entryPoint,
          fields: ["promotion_id", "promotion.id", ...TARGET_RULE_FIELDS],
          filters: { seller_id: seller },
        });

        const promotionMap = new Map<string, PromotionTypes.PromotionDTO>();
        for (const sp of sellerPromotions) {
          const promo = sp.promotion;
          if (promo?.id && !promotionMap.has(promo.id)) {
            promotionMap.set(promo.id, promo);
          }
        }

        const promotions = Array.from(promotionMap.values());
        if (!promotions.length) {
          continue;
        }

        const updates = buildRuleUpdates(promotions, sellerProductIds, "add");

        if (updates.length) {
          await promotionModule.updatePromotionRules(updates);
        }
      }

      return;
    }
    default:
      logger.warn(
        `Unsupported action "${action}" in syncSellersPromotionsDefaultProductRuleValues; productIds=${productIds.join(
          ","
        )}`
      );
      return;
  }
};
