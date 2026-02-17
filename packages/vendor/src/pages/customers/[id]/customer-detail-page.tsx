import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useCustomer } from "@hooks/api/customers";

import { CustomerGeneralSection } from "./_components/customer-general-section";
import { CustomerGroupSection } from "./_components/customer-group-section";
import { CustomerOrderSection } from "./_components/customer-order-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
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
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SingleColumnPage data={customer} hasOutlet>
          <CustomerGeneralSection customer={customer} />
          <CustomerOrderSection customer={customer} />
        </SingleColumnPage>
      )}
    </>
  );
};

export const CustomerDetailPage = Object.assign(Root, {
  GeneralSection: CustomerGeneralSection,
  OrderSection: CustomerOrderSection,
  GroupSection: CustomerGroupSection,
});
