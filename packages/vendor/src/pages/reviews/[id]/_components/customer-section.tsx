import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Container, Heading, Text } from "@medusajs/ui";
import { User, TriangleRightMini } from "@medusajs/icons";

import type { ReviewDTO } from "@hooks/api/reviews";

export const CustomerSection = ({ review }: { review: ReviewDTO }) => {
  const { t } = useTranslation();
  const customer = review.customer;

  const name = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.email ||
      "-"
    : "-";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center px-6 py-4">
        <Heading level="h2">{t("reviews.detail.customer")}</Heading>
      </div>
      {customer ? (
        <Link
          to={`/customers/${customer.id}`}
          className="hover:bg-ui-bg-subtle-hover flex items-center gap-x-3 px-6 py-4 transition-colors"
        >
          <div className="bg-ui-bg-base shadow-borders-base flex size-7 items-center justify-center rounded-md">
            <User className="text-ui-fg-subtle" />
          </div>
          <div className="flex flex-1 flex-col">
            <Text size="small" leading="compact" weight="plus">
              {name}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {customer.email || "-"}
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
