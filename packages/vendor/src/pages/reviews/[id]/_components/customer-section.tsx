import { User } from "@medusajs/icons";
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

export const CustomerSection = ({ review }: { review: ReviewDTO }) => {
  const { t } = useTranslation();
  const customer = review.customer;

  if (!customer) {
    return null;
  }

  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email ||
    customer.id;

  return (
    <SidebarCard title={t("reviews.detail.customer")}>
      <SidebarLink
        to={`/customers/${customer.id}`}
        labelKey={name}
        descriptionKey={customer.email ?? ""}
        icon={<User />}
        dataTestid="review-customer-link"
      />
    </SidebarCard>
  );
};
