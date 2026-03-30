import { Children, ReactNode } from "react";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useMe } from "@/hooks/api";

import { StoreAddressSection } from "./_components/store-address-section";
import { StoreConfigurationSection } from "./_components/store-configuration-section";
import { StoreGeneralSection } from "./_components/store-general-section";
import { StorePaymentDetailsSection } from "./_components/store-payment-details-section";
import { StoreProfessionalDetailsSection } from "./_components/store-professional-details-section";
import {
  StoreDetailHeader,
  StoreDetailTitle,
  StoreDetailActions,
  StoreDetailEditButton,
} from "./_components/store-detail-header";

const Root = ({ children }: { children?: ReactNode }) => {
  const { seller_member, isPending, isError, error } = useMe();

  const seller = seller_member?.seller;

  if (isPending || !seller) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={2} />;
  }

  if (isError) {
    throw error;
  }

  return Children.count(children) > 0 ? (
    <TwoColumnPage data={seller} hasOutlet>
      {children}
    </TwoColumnPage>
  ) : (
    <TwoColumnPage data={seller} hasOutlet>
      <TwoColumnPage.Main>
        <StoreGeneralSection seller={seller} />
        <StorePaymentDetailsSection seller={seller} />
        <StoreProfessionalDetailsSection seller={seller} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <StoreConfigurationSection seller={seller} />
        <StoreAddressSection seller={seller} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const StoreDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: StoreGeneralSection,
  MainPaymentDetailsSection: StorePaymentDetailsSection,
  MainProfessionalDetailsSection: StoreProfessionalDetailsSection,
  SidebarConfigurationSection: StoreConfigurationSection,
  SidebarAddressSection: StoreAddressSection,
  Header: StoreDetailHeader,
  HeaderTitle: StoreDetailTitle,
  HeaderActions: StoreDetailActions,
  HeaderEditButton: StoreDetailEditButton,
});
