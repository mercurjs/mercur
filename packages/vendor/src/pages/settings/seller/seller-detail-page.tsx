import { Children, ReactNode } from "react";

import { SingleColumnPageSkeleton } from "@components/common/skeleton";
import { SingleColumnPage } from "@components/layout/pages";
import { useMe } from "@/hooks/api";

import { SellerGeneralSection } from "./_components/seller-general-section";
import {
  SellerDetailHeader,
  SellerDetailTitle,
  SellerDetailActions,
  SellerDetailEditButton,
} from "./_components/seller-detail-header";

const Root = ({ children }: { children?: ReactNode }) => {
  const { seller, isPending, isError, error } = useMe();

  if (isPending || !seller) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage data={seller} hasOutlet>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <SellerGeneralSection seller={seller} />
      )}
    </SingleColumnPage>
  );
};

export const SellerDetailPage = Object.assign(Root, {
  GeneralSection: SellerGeneralSection,
  Header: SellerDetailHeader,
  HeaderTitle: SellerDetailTitle,
  HeaderActions: SellerDetailActions,
  HeaderEditButton: SellerDetailEditButton,
});
