import { ShoppingCart } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link";
import type { ReviewDTO } from "@hooks/api/reviews";

const SidebarCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Container className="divide-y p-0">
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{title}</Heading>
    </div>
    {children}
  </Container>
);

export const OrderSection = ({ review }: { review: ReviewDTO }) => {
  const { t } = useTranslation();
  const order = review.order;

  if (!order) {
    return null;
  }

  const date = order.created_at
    ? new Date(order.created_at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    <SidebarCard title={t("reviews.detail.order")}>
      <SidebarLink
        to={`/orders/${order.id}`}
        labelKey={`#${order.display_id}`}
        descriptionKey={date ?? ""}
        icon={<ShoppingCart />}
        dataTestid="review-order-link"
      />
    </SidebarCard>
  );
};
