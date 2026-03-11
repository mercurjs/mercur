import { MedusaContainer } from '@medusajs/framework';
import { BigNumberValue, OrderLineItemDTO } from '@medusajs/framework/types';
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules
} from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

import {
  CommissionModuleService,
  COMMISSION_MODULE
} from '../../../modules/commission';
import {
  CommissionLineDTO,
  CommissionRateDTO,
  CreateCommissionLineDTO
} from '@mercurjs/framework';

type StepInput = {
  order_id: string;
  seller_id: string;
  canceled_item_ids?: string[];
};

type ProductWithCategories = {
  id: string;
  categories?: Array<{ id: string }>;
};

async function calculateCommissionValue(
  rate: CommissionRateDTO,
  item: OrderLineItemDTO,
  currency: string,
  container: MedusaContainer
) {
  const priceService = container.resolve(Modules.PRICING);

  if (rate.type === 'flat') {
    const priceSet = await priceService.retrievePriceSet(rate.price_set_id!, {
      relations: ['prices']
    });
    const price = priceSet.prices?.find((p) => p.currency_code === currency);
    return price?.amount || MathBN.convert(0);
  }

  if (rate.type === 'percentage') {
    const total = MathBN.convert(item.total);
    const taxValue = MathBN.convert(item.tax_total);
    const calculationBase = rate.include_tax ? total : total.minus(taxValue);

    const commissionValue = MathBN.mult(
      calculationBase,
      MathBN.div(rate.percentage_rate!, 100)
    );

    const minPriceSet = rate.min_price_set_id
      ? await priceService.retrievePriceSet(rate.min_price_set_id!, {
          relations: ['prices']
        })
      : undefined;

    const maxPriceSet = rate.max_price_set_id
      ? await priceService.retrievePriceSet(rate.max_price_set_id!, {
          relations: ['prices']
        })
      : undefined;

    const minValue =
      minPriceSet?.prices?.find((p) => p.currency_code === currency)?.amount ||
      MathBN.convert(0);

    const maxValue =
      maxPriceSet?.prices?.find((p) => p.currency_code === currency)?.amount ||
      MathBN.convert(Number.POSITIVE_INFINITY);

    return MathBN.max(minValue, MathBN.min(maxValue, commissionValue));
  }

  return MathBN.convert(0);
}

type UpdateCommissionLine = {
  id: string;
  value: BigNumberValue;
};

type StepOutput = {
  updated: UpdateCommissionLine[];
  created: CommissionLineDTO[];
  soft_deleted: string[];
};

export const updateCommissionLinesForOrderStep = createStep(
  'update-commission-lines-for-order',
  async (
    { order_id, seller_id, canceled_item_ids }: StepInput,
    { container }
  ): Promise<StepResponse<StepOutput, StepOutput>> => {
    const orderService = container.resolve(Modules.ORDER);
    const commissionService =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const order = await orderService.retrieveOrder(order_id, {
      relations: ['items'],
      select: ['*', 'item_total']
    });

    const currentItemIds = order.items?.map((item) => item.id) || [];

    const allItemIds = [
      ...new Set([...currentItemIds, ...(canceled_item_ids || [])])
    ];

    let existingLines: CommissionLineDTO[] = [];
    if (allItemIds.length > 0) {
      existingLines = await commissionService.listCommissionLines(
        {
          item_line_id: allItemIds,
          deleted_at: null
        },
        { relations: ['*'] }
      );
    }

    if (!order.items || order.items.length === 0) {
      const toSoftDelete = existingLines.map((line) => line.id);
      if (toSoftDelete.length > 0) {
        await commissionService.softDeleteLines(toSoftDelete);
      }
      return new StepResponse(
        {
          updated: [],
          created: [],
          soft_deleted: toSoftDelete
        },
        {
          updated: [],
          created: [],
          soft_deleted: toSoftDelete
        }
      );
    }

    const existingLinesByItemId = new Map(
      existingLines.map((line) => [line.item_line_id, line])
    );

    const toUpdate: UpdateCommissionLine[] = [];
    const toCreate: CreateCommissionLineDTO[] = [];
    const toSoftDelete: string[] = [];

    const productIds = order.items.map((item) => item.product_id);
    const { data: products } = await query.graph({
      entity: 'product',
      fields: ['id', 'categories.id'],
      filters: { id: productIds }
    });

    const productCategoriesMap = new Map(
      (products as ProductWithCategories[]).map((p) => [
        p.id,
        p.categories?.[0]?.id || ''
      ])
    );

    for (const item of order.items) {
      const existingLine = existingLinesByItemId.get(item.id);
      const productCategoryId =
        productCategoriesMap.get(item.product_id!) || '';

      const commissionRule =
        await commissionService.selectCommissionForProductLine({
          product_category_id: productCategoryId,
          product_type_id: item.product_type_id || '',
          seller_id
        });

      if (!commissionRule) {
        if (existingLine) {
          toSoftDelete.push(existingLine.id);
        }
        continue;
      }

      const newValue = await calculateCommissionValue(
        commissionRule.rate,
        item,
        order.currency_code,
        container
      );

      if (existingLine) {
        if (!MathBN.eq(existingLine.value, newValue)) {
          toUpdate.push({
            id: existingLine.id,
            value: newValue
          });
        }
        existingLinesByItemId.delete(item.id);
      } else {
        toCreate.push({
          item_line_id: item.id,
          value: newValue,
          currency_code: order.currency_code,
          rule_id: commissionRule.id
        });
      }
    }

    for (const [, line] of existingLinesByItemId) {
      toSoftDelete.push(line.id);
    }

    if (toUpdate.length > 0) {
      // @ts-expect-error BigNumber incompatible interface
      await commissionService.updateCommissionLines(toUpdate);
    }

    let created: CommissionLineDTO[] = [];
    if (toCreate.length > 0) {
      // @ts-expect-error BigNumber incompatible interface
      created = await commissionService.createCommissionLines(toCreate);
    }

    if (toSoftDelete.length > 0) {
      await commissionService.softDeleteLines(toSoftDelete);
    }

    return new StepResponse(
      {
        updated: toUpdate,
        created,
        soft_deleted: toSoftDelete
      },
      {
        updated: toUpdate,
        created,
        soft_deleted: toSoftDelete
      }
    );
  },
  async (compensateData, { container }) => {
    if (!compensateData) {
      return;
    }

    const commissionService =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    if (compensateData.soft_deleted.length > 0) {
      await commissionService.restoreLines(compensateData.soft_deleted);
    }

    if (compensateData.created.length > 0) {
      const createdIds = compensateData.created.map((c) => c.id);
      await commissionService.deleteCommissionLines(createdIds);
    }
  }
);
