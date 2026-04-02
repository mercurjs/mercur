import { CurrencyDollar } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { IconAvatar } from "@components/common/icon-avatar";
import { NoRecords } from "@components/common/empty-table-content";
import { getStylizedAmount } from "@/lib/money-amount-helpers";
import { HttpTypes } from "@mercurjs/types";

type StoreSubscriptionSectionProps = {
  subscription_plan?: HttpTypes.VendorSubscriptionResponse["subscription_plan"];
  subscription_override?: HttpTypes.VendorSubscriptionResponse["subscription_override"];
};

export const StoreSubscriptionSection = ({
  subscription_plan,
  subscription_override,
}: StoreSubscriptionSectionProps) => {
  const { t } = useTranslation();

  const effectiveMonthlyAmount =
    subscription_override?.monthly_amount ?? subscription_plan?.monthly_amount;

  if (!subscription_plan) {
    return null;
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("store.subscription.header")}</Heading>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-4">
            <IconAvatar size="large" variant="squared">
              <CurrencyDollar />
            </IconAvatar>
            <div className="flex flex-1 flex-col">
              <Text size="small" leading="compact" weight="plus">
                {subscription_plan.currency_code?.toUpperCase()}
              </Text>
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {getStylizedAmount(
                  effectiveMonthlyAmount ?? 0,
                  subscription_plan.currency_code,
                )}
                /{t("store.subscription.month", "month")}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
