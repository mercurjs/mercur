import { Children, ReactNode } from "react";
import { Alert, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useMe, useSeller } from "@/hooks/api";
import { SellerStatus } from "@mercurjs/types";

import { StoreAddressSection } from "./_components/store-address-section";
import { StoreTimeOffSection } from "./_components/store-time-off-section";
import { StoreGeneralSection } from "./_components/store-general-section";
import { StorePaymentDetailsSection } from "./_components/store-payment-details-section";
import { StoreProfessionalDetailsSection } from "./_components/store-professional-details-section";
import {
  StoreDetailHeader,
  StoreDetailTitle,
  StoreDetailActions,
  StoreDetailEditButton,
} from "./_components/store-detail-header";

const ME_SELLER_FIELDS =
  "+seller.*,+seller.address.*,+seller.payment_details.*,+seller.professional_details.*";
const SELLER_DETAIL_FIELDS =
  "+address.*,+payment_details.*,+professional_details.*";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe({
    fields: ME_SELLER_FIELDS,
  });

  const meSeller = seller_member?.seller;

  const query = useLinkQuery("seller", SELLER_DETAIL_FIELDS);
  const needsLinks = !!useLinkQuery("seller").fields;

  const { seller: linkedSeller, isPending: linkedPending } = useSeller(
    meSeller?.id ?? "",
    query,
    { enabled: needsLinks && !!meSeller?.id },
  );

  const seller = needsLinks ? linkedSeller : meSeller;

  if (isError) {
    throw error;
  }

  if (isPending || !seller || (needsLinks && linkedPending)) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={3} />;
  }

  const statusAlert = (() => {
    switch (seller.status) {
      case SellerStatus.TERMINATED:
        return {
          variant: "error" as const,
          title: t("store.alert.terminated.title"),
          description:
            seller.status_reason || t("store.alert.terminated.description"),
        };
      default:
        return null;
    }
  })();

  const StatusBanner = () => (
    <>
      <WidgetZone id="seller.setup" data={seller} />
      {statusAlert && (
        <Alert variant={statusAlert.variant} dismissible className="p-5">
          <div className="text-ui-fg-subtle txt-small pb-2 font-medium leading-[20px]">
            {statusAlert.title}
          </div>
          <Text className="text-ui-fg-subtle txt-small leading-normal">
            {statusAlert.description}
          </Text>
        </Alert>
      )}
    </>
  );

  if (Children.count(children) > 0) {
    return (
      <TwoColumnPage data={seller} hasOutlet>
        {children}
      </TwoColumnPage>
    );
  }

  return (
    <TwoColumnPage data={seller} hasOutlet>
      <TwoColumnPage.Main>
        <StatusBanner />
        <StoreGeneralSection seller={seller} />
        <StoreTimeOffSection seller={seller} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <StoreAddressSection seller={seller} />
        <StoreProfessionalDetailsSection seller={seller} />
        <StorePaymentDetailsSection seller={seller} />
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
  MainTimeOffSection: StoreTimeOffSection,
  SidebarAddressSection: StoreAddressSection,
  Header: StoreDetailHeader,
  HeaderTitle: StoreDetailTitle,
  HeaderActions: StoreDetailActions,
  HeaderEditButton: StoreDetailEditButton,
});
