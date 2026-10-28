import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { PayoutDTO } from "@mercurjs/types";
import { useTranslation } from "react-i18next";

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link";

type PayoutWithOrder = PayoutDTO & {
  order?: { id: string; display_id: number } | null;
};

export const PayoutReferencesSection = ({ payout }: { payout: PayoutWithOrder }) => {
  const { t } = useTranslation();

  return (
    <Container className="p-0" data-testid="payout-references-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.references.header")}</Heading>
      </div>
      {payout.order_id ? (
        <SidebarLink
          to={`/orders/${payout.order_id}`}
          labelKey={t("payouts.order")}
          descriptionKey={payout.order?.display_id ? `#${payout.order.display_id}` : payout.order_id}
          icon={<ShoppingCart />}
          dataTestid="payout-reference-order"
        />
      ) : (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payouts.references.empty")}
          </Text>
        </div>
      )}
    </Container>
  );
};
