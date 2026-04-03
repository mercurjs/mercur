import { CurrencyDollar, TriangleRightMini } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { IconAvatar } from "../../../../components/common/icon-avatar";
import { getStylizedAmount } from "../../../../lib/money-amount-helpers";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useSubscriptionPlans } from "@hooks/api/subscription-plans";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreSubscriptionSectionProps = {
  seller: Seller;
};

export const StoreSubscriptionSection = ({
  seller,
}: StoreSubscriptionSectionProps) => {
  const { t } = useTranslation();

  const { subscription_plans } = useSubscriptionPlans({
    currency_code: seller.currency_code,
    limit: 100,
    offset: 0,
  });

  const plan = subscription_plans?.find(
    (p) => p.currency_code === seller.currency_code,
  );

  if (!plan) {
    return null;
  }

  const override = plan.overrides?.find(
    (o) => o.reference === "seller" && o.reference_id === seller.id,
  );

  const effectiveAmount = override?.monthly_amount ?? plan.monthly_amount;

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t("store.subscription.header")}
        </Heading>
      </div>
      <div className="flex flex-col gap-2 px-2 pb-2">
        <Link
          to={`/subscription-plans/${plan.id}`}
          className="group outline-none rounded-md focus-within:shadow-borders-interactive-with-focus [&:hover>div]:bg-ui-bg-component-hover"
        >
          <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
            <div className="flex items-center gap-4">
              <IconAvatar size="large" variant="squared">
                <CurrencyDollar />
              </IconAvatar>
              <div className="flex flex-1 flex-col">
                <Text size="small" leading="compact" weight="plus">
                  {plan.currency_code.toUpperCase()}
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {getStylizedAmount(effectiveAmount, plan.currency_code)}/{t("store.subscription.month")}
                </Text>
              </div>
              <div className="flex size-7 items-center justify-center">
                <TriangleRightMini className="text-ui-fg-muted" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </Container>
  );
};
