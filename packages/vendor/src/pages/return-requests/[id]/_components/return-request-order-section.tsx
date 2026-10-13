import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link";
import type { VendorReturnRequest } from "@hooks/api/return-requests";

export const ReturnRequestOrderSection = ({
  returnRequest,
}: {
  returnRequest: VendorReturnRequest;
}) => {
  const { t } = useTranslation();
  const order = returnRequest.order;

  if (!order) {
    return null;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("returnRequests.detail.order")}</Heading>
      </div>
      <SidebarLink
        to={`/orders/${order.id}`}
        labelKey={`#${order.display_id}`}
        descriptionKey={order.email ?? ""}
        icon={<ShoppingCart />}
        dataTestid="return-request-order-link"
      />
    </Container>
  );
};
