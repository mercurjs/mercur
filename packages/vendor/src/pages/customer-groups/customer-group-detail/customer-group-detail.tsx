import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
  PermissionGuard,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useCustomerGroup } from "@hooks/api/customer-groups";

import { CustomerGroupCustomerSection } from "./components/customer-group-customer-section";
import { CustomerGroupGeneralSection } from "./components/customer-group-general-section";
import { CUSTOMER_GROUP_DETAIL_FIELDS } from "./constants";
import { customerGroupLoader } from "./loader";

export const CustomerGroupDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof customerGroupLoader>
  >;

  const { id } = useParams();
  const query = useLinkQuery("customer_group", CUSTOMER_GROUP_DETAIL_FIELDS);
  const { customer_group, isLoading, isError, error } = useCustomerGroup(
    id!,
    query,
    { initialData },
  );

  if (isLoading || !customer_group) {
    return <SingleColumnPageSkeleton sections={2} showJSON />;
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="customer-groups.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      data={customer_group}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CustomerGroupGeneralSection">
              <CustomerGroupGeneralSection group={customer_group} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerGroupCustomerSection">
              <PermissionGuard permission="customers:view">
                <CustomerGroupCustomerSection group={customer_group} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(customer_group, { metadata: false })}
          </>
        ),
      }}
    />
  );
};
