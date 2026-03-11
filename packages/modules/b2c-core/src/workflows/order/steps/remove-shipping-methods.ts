import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';

type StepOutput = {
  removed: boolean;
  shipping_method_ids?: string[];
};

export const removeShippingMethodsStep = createStep(
  'remove-shipping-methods',
  async (
    {
      order_id,
      should_remove
    }: {
      order_id: string;
      should_remove: boolean;
    },
    { container }
  ): Promise<StepResponse<StepOutput, StepOutput>> => {
    if (!should_remove) {
      return new StepResponse({ removed: false }, { removed: false });
    }

    const orderService = container.resolve(Modules.ORDER);

    const order = await orderService.retrieveOrder(order_id, {
      relations: ['shipping_methods']
    });

    if (!order.shipping_methods || order.shipping_methods.length === 0) {
      return new StepResponse({ removed: false }, { removed: false });
    }

    const shippingMethodIds = order.shipping_methods.map((sm) => sm.id);

    await orderService.softDeleteOrderShippingMethods(shippingMethodIds);

    return new StepResponse(
      { removed: true, shipping_method_ids: shippingMethodIds },
      { removed: true, shipping_method_ids: shippingMethodIds }
    );
  },
  async (compensateData, { container }) => {
    if (
      !compensateData ||
      !compensateData.removed ||
      !compensateData.shipping_method_ids
    ) {
      return;
    }

    const orderService = container.resolve(Modules.ORDER);

    await orderService.restoreOrderShippingMethods(
      compensateData.shipping_method_ids
    );
  }
);
