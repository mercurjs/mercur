import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';
import { Modules } from '@medusajs/framework/utils';

import {
  CommissionModuleService,
  COMMISSION_MODULE
} from '../../../modules/commission';

type StepInput = {
  order_id: string;
  seller_id: string;
};

export const deleteCommissionLinesByOrderStep = createStep(
  'delete-commission-lines-by-order',
  async ({ order_id }: StepInput, { container }) => {
    const orderService = container.resolve(Modules.ORDER);
    const commissionService =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    const order = await orderService.retrieveOrder(order_id, {
      relations: ['items']
    });

    if (!order.items || order.items.length === 0) {
      return new StepResponse([], []);
    }

    const itemIds = order.items.map((item) => item.id);

    const existingLines = await commissionService.listCommissionLines({
      item_line_id: itemIds
    });

    if (existingLines.length === 0) {
      return new StepResponse([], []);
    }

    const lineIds = existingLines.map((line) => line.id);

    await commissionService.deleteCommissionLines(lineIds);

    return new StepResponse(lineIds, existingLines);
  },
  async (deletedLineIds, { container }) => {
    if (!deletedLineIds || deletedLineIds.length === 0) {
      return;
    }

    const commissionService =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    await commissionService.createCommissionLines(deletedLineIds);
  }
);
