import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";

import { useCustomer } from "@hooks/api/customers";

type CustomerDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCustomerResponse>;

export const Breadcrumb = (props: CustomerDetailBreadcrumbProps) => {
  const { id } = props.params || {};
  const { customer } = useCustomer(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  });

  if (!customer) return null;

  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  return <span>{name || customer.email}</span>;
};
