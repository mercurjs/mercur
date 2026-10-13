import { User } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { SidebarLink } from "@components/common/sidebar-link/sidebar-link";
import type { VendorReturnRequest } from "@hooks/api/return-requests";

import { customerName } from "../../common/utils";

export const ReturnRequestCustomerSection = ({
  returnRequest,
}: {
  returnRequest: VendorReturnRequest;
}) => {
  const { t } = useTranslation();
  const customer = returnRequest.customer;

  if (!customer) {
    return null;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("returnRequests.detail.customer")}</Heading>
      </div>
      <SidebarLink
        to={`/customers/${customer.id}`}
        labelKey={customerName(customer)}
        descriptionKey={customer.email ?? ""}
        icon={<User />}
        dataTestid="return-request-customer-link"
      />
    </Container>
  );
};
