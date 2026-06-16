import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useCustomerGroup } from "@hooks/api/customer-groups";

import { CustomerGroupCustomerSection } from "./components/customer-group-customer-section";
import { CustomerGroupGeneralSection } from "./components/customer-group-general-section";
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants";
import { customerGroupLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerGroupLoader>
  >;

  const { id } = useParams();
  const { customer_group, isLoading, isError, error } = useCustomerGroup(
    id!,
    {
      fields: CUSTOMER_GROUP_DETAIL_FIELDS,
    },
    { initialData },
  );

  if (isLoading || !customer_group) {
    return <SingleColumnPageSkeleton sections={2} showJSON showMetadata />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <SingleColumnPage showJSON showMetadata data={customer_group} hasOutlet>
      {children}
    </SingleColumnPage>
  ) : (
    <SingleColumnPage showJSON showMetadata data={customer_group} hasOutlet>
      <CustomerGroupGeneralSection group={customer_group} />
      <CustomerGroupCustomerSection group={customer_group} />
    </SingleColumnPage>
  );
};

export const CustomerGroupDetailPage = Object.assign(Root, {
  GeneralSection: CustomerGroupGeneralSection,
  CustomerSection: CustomerGroupCustomerSection,
});
