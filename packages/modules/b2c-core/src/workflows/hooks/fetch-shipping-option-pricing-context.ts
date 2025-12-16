import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { fetchShippingOptionForOrderWorkflow } from "@medusajs/medusa/core-flows";
import { StepResponse } from "@medusajs/framework/workflows-sdk";

import sellerOrder from "../../links/seller-order";
import sellerStockLocation from "../../links/seller-stock-location";

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
    { shipping_option_id, currency_code, order_id, context, additional_data },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: sellerOrderLinks } = await query.graph({
      entity: sellerOrder.entryPoint,
      fields: ["seller_id"],
      filters: {
        order_id: order_id,
      },
    });

    if (!sellerOrderLinks.length) {
      return new StepResponse({});
    }

    const sellerId = sellerOrderLinks[0].seller_id;

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
      });
    }

    const { data: sellerStockLocations } = await query.graph({
      entity: sellerStockLocation.entryPoint,
      fields: ["stock_location_id"],
      filters: {
        seller_id: sellerId,
      },
    });

    if (sellerStockLocations.length) {
      return new StepResponse({
        location_id: sellerStockLocations[0].stock_location_id,
      });
    }

    return new StepResponse({});
  }
);

