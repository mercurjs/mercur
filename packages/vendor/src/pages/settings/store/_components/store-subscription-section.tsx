import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { NoRecords } from "@components/common/empty-table-content";
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
  const effectiveFreeMonths =
    subscription_override?.free_months ?? subscription_plan?.free_months;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("store.subscription.header")}</Heading>
      </div>
      {!subscription_plan ? (
        <NoRecords
          className="h-[180px]"
          icon={null}
          title={t("store.subscription.noPlan")}
          message={t("store.subscription.noPlanMessage")}
        />
      ) : (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("store.subscription.monthlyAmount")}
          </Text>
          <Text size="small" leading="compact">
            {effectiveMonthlyAmount}{" "}
            {subscription_plan.currency_code?.toUpperCase()}
          </Text>

          <Text size="small" leading="compact" weight="plus">
            {t("store.subscription.freeMonths")}
          </Text>
          <Text size="small" leading="compact">
            {effectiveFreeMonths}
          </Text>

          {subscription_override?.free_from && (
            <>
              <Text size="small" leading="compact" weight="plus">
                {t("store.subscription.freePeriod")}
              </Text>
              <Text size="small" leading="compact">
                {new Date(subscription_override.free_from).toLocaleDateString()}
                {subscription_override.free_to &&
                  ` – ${new Date(subscription_override.free_to).toLocaleDateString()}`}
              </Text>
            </>
          )}

          <Text size="small" leading="compact" weight="plus">
            {t("store.subscription.requiresOrders")}
          </Text>
          <Text size="small" leading="compact">
            {subscription_plan.requires_orders
              ? t("general.yes")
              : t("general.no")}
          </Text>
        </div>
      )}
    </Container>
  );
};
