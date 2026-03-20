import { MedusaError } from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

type ValidateAdminShippingSelectorIdInput = {
  sellerShippingOptions: Array<{
    shipping_option: { id: string };
    seller_id: string;
  }>;
  newShippingOptionId: string;
  inputSellerId?: string;
};

export const validateAdminShippingSelectorIdStep = createStep(
  'validate-admin-shipping-seller-id',
  async (input: ValidateAdminShippingSelectorIdInput) => {
    const isVendorShipping = input.sellerShippingOptions.some(
      (so) => so.shipping_option.id === input.newShippingOptionId
    );

    if (!isVendorShipping && !input.inputSellerId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Admin shipping option requires 'seller_id' in data field. Please specify which seller this shipping method is for. Example: { "option_id": "...", "data": { "seller_id": "..." } }`
      );
    }

    return new StepResponse({ validated: true });
  }
);
