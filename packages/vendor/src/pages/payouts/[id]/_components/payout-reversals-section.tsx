import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";
import { getStylizedAmount } from "@lib/money-amount-helpers";

import { payoutStatusColor } from "../../_components/payout-status";

export const PayoutReversalsSection = ({ payout }: { payout: PayoutDTO }) => {
  const { t } = useTranslation();

  const reversals = payout.reversals ?? [];

  if (!reversals.length) {
    return null;
  }

  return (
    <Container className="divide-y p-0" data-testid="payout-reversals-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.reversals.header")}</Heading>
      </div>
      {reversals.map((reversal) => (
        <div
          key={reversal.id}
          className="flex items-center justify-between gap-x-4 px-6 py-4"
          data-testid={`payout-reversal-${reversal.id}`}
        >
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact" weight="plus">
              {getStylizedAmount(Number(reversal.amount), payout.currency_code)}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {new Date(reversal.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </div>
          <StatusBadge color={payoutStatusColor(reversal.status)}>
            {t(`payouts.status.${reversal.status}`, {
              defaultValue: reversal.status,
            })}
          </StatusBadge>
        </div>
      ))}
    </Container>
  );
};
