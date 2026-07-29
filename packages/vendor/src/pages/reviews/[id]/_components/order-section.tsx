import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Container, Heading, Text } from "@medusajs/ui";
import { ShoppingCart, TriangleRightMini } from "@medusajs/icons";

import type { ReviewDTO } from "@hooks/api/reviews";

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const OrderSection = ({ review }: { review: ReviewDTO }) => {
  const { t } = useTranslation();
  const order = review.order;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center px-6 py-4">
        <Heading level="h2">{t("reviews.detail.order")}</Heading>
      </div>
      {order ? (
        <Link
          to={`/orders/${order.id}`}
          className="hover:bg-ui-bg-subtle-hover flex items-center gap-x-3 px-6 py-4 transition-colors"
        >
          <div className="bg-ui-bg-base shadow-borders-base flex size-7 items-center justify-center rounded-md">
            <ShoppingCart className="text-ui-fg-subtle" />
          </div>
          <div className="flex flex-1 flex-col">
            <Text size="small" leading="compact" weight="plus">
              #{order.display_id}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {formatDateTime(order.created_at)}
            </Text>
          </div>
          <TriangleRightMini className="text-ui-fg-muted" />
        </Link>
      ) : (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            -
          </Text>
        </div>
      )}
    </Container>
  );
};
