import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useCustomer } from "@hooks/api/customers";

import { CustomerAddressSection } from "./_components/customer-address-section";
import { CustomerGeneralSection } from "./_components/customer-general-section";
import { CustomerGroupSection } from "./_components/customer-group-section";
import { CustomerOrderSection } from "./_components/customer-order-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
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
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={customer} showJSON hasOutlet>
          <TwoColumnPage.Main>
            <WidgetZone id="customers.detail.main" data={customer}>
              <CustomerGeneralSection customer={customer} />
              <CustomerOrderSection customer={customer} />
              <CustomerGroupSection customer={customer} />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="customers.detail.side" data={customer}>
              <CustomerAddressSection customer={customer} />
            </WidgetZone>
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const CustomerDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  GeneralSection: CustomerGeneralSection,
  OrderSection: CustomerOrderSection,
  GroupSection: CustomerGroupSection,
  AddressSection: CustomerAddressSection,
});
