import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchShippingOptionForOrderWorkflow } from "@medusajs/medusa/core-flows";
import { StepResponse } from "@medusajs/framework/workflows-sdk";

import sellerOrder from "../../links/seller-order";
import sellerShippingOption from "../../links/seller-shipping-option";
import sellerStockLocation from "../../links/seller-stock-location";

type SellerStockLocationWithFulfillment = {
  stock_location_id: string;
  stock_location: {
    fulfillment_sets?: Array<{
      id: string;
      service_zones?: Array<{
        shipping_options?: Array<{
          id: string;
        }>;
      }>;
    }>;
  };
};

type OrderData = {
  id: string;
  region_id: string | null;
};

/**
 * This hook provides the pricing context for shipping options in RMA flows (claims, returns, exchanges).
 * 
 * In a marketplace scenario, shipping options are linked to seller stock locations.
 * When an admin creates a claim on a seller's order, the shipping option's price needs
 * to be calculated using the seller's stock location context.
 * 
 * Without this hook, the pricing calculation fails because:
 * 1. The shipping option belongs to a seller's fulfillment set/stock location
 * 2. The default pricing context doesn't include the stock location
 * 3. The calculated_price returns null, causing the workflow to fail
 */
fetchShippingOptionForOrderWorkflow.hooks.setPricingContext(
  async (
    { shipping_option_id, order_id },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: sellerOrderLinks } = await query.graph({
      entity: sellerOrder.entryPoint,
      fields: ["seller_id"],
      filters: {
        order_id,
      },
    });

    if (!sellerOrderLinks.length) {
      return new StepResponse({});
    }

    const { data: orderData } = await query.graph({
      entity: "order",
      fields: ["id", "region_id"],
      filters: {
        id: order_id,
      },
    });

    const regionId = (orderData[0] as OrderData | undefined)?.region_id;

    const { data: shippingOptionData } = await query.graph({
      entity: "shipping_option",
      fields: [
        "id",
        "service_zone.fulfillment_set.location.id",
        "service_zone.fulfillment_set.location.name",
      ],
      filters: {
        id: shipping_option_id,
      },
    });

    const shippingOption = shippingOptionData[0] as any;
    const locationFromOption =
      shippingOption?.service_zone?.fulfillment_set?.location;

    if (locationFromOption?.id) {
      return new StepResponse({
        location_id: locationFromOption.id,
        ...(regionId && { region_id: regionId }),
      });
    }

    const { data: shippingOptionSeller } = await query.graph({
      entity: sellerShippingOption.entryPoint,
      fields: ["seller_id"],
      filters: {
        shipping_option_id,
      },
    });

    const shippingOptionSellerId = shippingOptionSeller[0]?.seller_id;

    if (shippingOptionSellerId) {
      const { data: sellerLocations } = await query.graph({
        entity: sellerStockLocation.entryPoint,
        fields: [
          "stock_location_id",
          "stock_location.fulfillment_sets.id",
          "stock_location.fulfillment_sets.service_zones.shipping_options.id",
        ],
        filters: {
          seller_id: shippingOptionSellerId,
        },
      }) as { data: SellerStockLocationWithFulfillment[] };

      for (const location of sellerLocations) {
        const hasShippingOption = location.stock_location?.fulfillment_sets?.some(
          (fs) =>
            fs.service_zones?.some((sz) =>
              sz.shipping_options?.some((so) => so.id === shipping_option_id)
            )
        );

        if (hasShippingOption) {
          return new StepResponse({
            location_id: location.stock_location_id,
            ...(regionId && { region_id: regionId }),
          });
        }
      }
    }

    return new StepResponse({
      ...(regionId && { region_id: regionId }),
    });
  }
);

