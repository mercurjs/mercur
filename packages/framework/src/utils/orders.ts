import type {
  ActionEligibilityResult,
  Fulfillment
} from '../types/order-return-request/common';

const getActionWindowDays = (): number => {
  const envValue = process.env.ORDER_ACTION_WINDOW_DAYS;
  return envValue ? parseInt(envValue, 10) : 30;
};

export function canPerformAction(
  deliveredAt: Date | string
): ActionEligibilityResult {
  const ACTION_WINDOW_DAYS = getActionWindowDays();
  const now = new Date();
  const deliveryDate = new Date(deliveredAt);

  const daysSinceDelivery = Math.floor(
    (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysRemaining = ACTION_WINDOW_DAYS - daysSinceDelivery;
  const canPerform = daysRemaining >= 0;

  return {
    canPerform,
    daysRemaining: Math.max(0, daysRemaining)
  };
}

export function findLastDeliveryForItem(
  itemId: string,
  fulfillments: Fulfillment[]
): Fulfillment | undefined {
  const itemFulfillments = fulfillments
    .filter((f) => {
      const hasDeliveredAt = !!f.delivered_at;
      const matchesItem = f.items?.some((fi) => {
        return fi.line_item_id === itemId;
      });

      return matchesItem && hasDeliveredAt;
    })
    .sort(
      (a, b) =>
        new Date(b.delivered_at!).getTime() -
        new Date(a.delivered_at!).getTime()
    );

  return itemFulfillments[0];
}

export { getActionWindowDays };
