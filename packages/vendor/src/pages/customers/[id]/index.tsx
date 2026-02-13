// Route: /customers/:id
import { HttpTypes } from "@medusajs/types";
import {
  UIMatch,
  useLoaderData,
  useParams,
  LoaderFunctionArgs,
} from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useDashboardExtension } from "@/extensions";
import { useCustomer } from "@hooks/api/customers";
import { productsQueryKeys } from "@hooks/api/products";
import { fetchQuery } from "@lib/client";
import { queryClient } from "@lib/query-client";

import { CustomerGeneralSection } from "./_components/customer-general-section";
import { CustomerOrderSection } from "./_components/customer-order-section";

// Loader
const customerDetailQuery = (id: string) => ({
  queryKey: productsQueryKeys.detail(id),
  queryFn: async () =>
    fetchQuery(`/vendor/customers/${id}`, {
      method: "GET",
      query: { fields: "*groups, *groups.customers" },
    }),
});

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = customerDetailQuery(id!);
  return queryClient.ensureQueryData(query);
};

// Breadcrumb
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

// Main component
export const Component = () => {
  const { id } = useParams();
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { customer, isLoading, isError, error } = useCustomer(
    id!,
    {},
    { initialData },
  );

  if (isLoading || !customer) return <SingleColumnPageSkeleton sections={2} />;
  if (isError) throw error;

  return (
    <SingleColumnPage data={customer} hasOutlet>
      <CustomerGeneralSection customer={customer} />
      <CustomerOrderSection customer={customer} />
      {/* TODO: Customer groups - vendor API does not support customer groups yet
      <CustomerGroupSection customer={customer} />
      */}
    </SingleColumnPage>
  );
};
