import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";
import { createShippingProfilesWorkflow } from "@medusajs/medusa/core-flows";
import { SELLER_MODULE } from "../../../modules/seller";
import { SellerDTO } from "@mercurjs/framework";

export const createSellerShippingProfileStep = createStep(
  "create-seller-shipping-profile",
  async ({ id: sellerId }: SellerDTO, { container }) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const { result } = await createShippingProfilesWorkflow.run({
      container,
      input: {
        data: [
          {
            type: "default",
            name: `${sellerId}:Default shipping profile`,
          },
        ],
      },
    });

    await link.create({
      [SELLER_MODULE]: {
        seller_id: sellerId,
      },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: result[0].id,
      },
    });
  }
);
