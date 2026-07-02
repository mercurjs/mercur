import { getLocaleAmount } from "@lib/money-amount-helpers";
import { useOrderCommissionLines } from "@hooks/api/orders";
import type { AdminOrder } from "@medusajs/types";
import { Container, Heading, Text } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type OrderCommissionSectionProps = {
  order: AdminOrder;
};

export const OrderCommissionSection = ({
  order,
}: OrderCommissionSectionProps) => {
  const { t } = useTranslation();
  const { commission_lines, isLoading } = useOrderCommissionLines(order.id);

  const itemTitleById = useMemo(() => {
    const map = new Map<string, string>();
    order.items?.forEach((item: any) => {
      map.set(item.id, item.product_title ?? item.title);
    });
    return map;
  }, [order.items]);

  if (isLoading || !commission_lines.length) {
    return null;
  }

  const total = commission_lines.reduce(
    (acc, line) => acc + (line.amount ?? 0),
    0
  );

  return (
    <Container className="divide-y p-0" data-testid="order-commission-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("fields.commission")}</Heading>
      </div>
      <div className="divide-y">
        {commission_lines.map((line) => {
          const label = line.shipping_method_id
            ? t("fields.shipping")
            : itemTitleById.get(line.item_id ?? "") ?? line.code;
          return (
            <div
              key={line.id}
              className="text-ui-fg-subtle grid grid-cols-2 items-center gap-4 px-6 py-4"
            >
              <Text size="small" leading="compact">
                {label}
              </Text>
              <Text size="small" leading="compact" className="text-right">
                {getLocaleAmount(line.amount, order.currency_code)}
              </Text>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" weight="plus" leading="compact">
          {t("orders.commission.total")}
        </Text>
        <Text size="small" weight="plus" leading="compact">
          {getLocaleAmount(total, order.currency_code)}
        </Text>
      </div>
    </Container>
  );
};
