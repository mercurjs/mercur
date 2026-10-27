import { format, parseISO } from 'date-fns';

export type DeliveryEstimate = {
  shipping_deadline: string;
  earliest: string | null;
  latest: string | null;
};

// Dates arrive as `YYYY-MM-DD`; parseISO reads them as local midnight, whereas
// `new Date()` reads UTC and shifts the day for shoppers west of Greenwich.
const formatDay = (date: string) => format(parseISO(date), 'MMM d');

export const formatDeliveryEstimate = (
  estimate: DeliveryEstimate | null | undefined
): string | null => {
  if (!estimate) return null;

  const { earliest, latest } = estimate;

  if (earliest && latest) {
    return earliest === latest
      ? `Delivery ${formatDay(latest)}`
      : `Delivery ${formatDay(earliest)}–${formatDay(latest)}`;
  }

  if (latest) return `Delivery by ${formatDay(latest)}`;

  return null;
};

const toDateOrNull = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

export const getExpectedDelivery = (
  order: object | null | undefined
): DeliveryEstimate | null => {
  const value = order && "expected_delivery" in order ? order.expected_delivery : undefined;

  if (!value || typeof value !== 'object') return null;

  const { shipping_deadline, earliest, latest } = value as Record<string, unknown>;

  if (typeof shipping_deadline !== 'string') return null;

  return {
    shipping_deadline,
    earliest: toDateOrNull(earliest),
    latest: toDateOrNull(latest)
  };
};
