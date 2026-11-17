import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
  PermissionGuard,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useCustomer } from "@hooks/api/customers";

import { CustomerAddressSection } from "./_components/customer-address-section";
import { CustomerGeneralSection } from "./_components/customer-general-section";
import { CustomerGroupSection } from "./_components/customer-group-section";
import { CustomerOrderSection } from "./_components/customer-order-section";

import type { loader } from "./loader";

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const query = useLinkQuery("customer", "*groups, *groups.customers");
  const { customer, isLoading, isError, error } = useCustomer(id!, query, {
    initialData,
  });

  if (isLoading || !customer) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} />;
  }
  if (isError) throw error;

  return (
    <LayoutComposer
      widgetsZonePrefix="customers.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={customer}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CustomerGeneralSection">
              <CustomerGeneralSection customer={customer} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerOrderSection">
              <PermissionGuard permission="orders:view">
                <CustomerOrderSection customer={customer} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CustomerGroupSection">
              <PermissionGuard permission="customer_groups:view">
                <CustomerGroupSection customer={customer} />
              </PermissionGuard>
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(customer, { metadata: false })}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="CustomerAddressSection">
            <CustomerAddressSection customer={customer} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
