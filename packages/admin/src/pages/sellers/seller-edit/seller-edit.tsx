import { useParams } from "react-router-dom";

import type { VendorSeller } from "@custom-types/seller";

import { RouteDrawer } from "@components/modals";

import { useSeller } from "@hooks/api/sellers";

import { SellerDetails } from "@routes/sellers/seller-details/components/seller-details";
import { SellerEditForm } from "@routes/sellers/seller-edit/components/seller-edit-form";
import { useTranslation } from "react-i18next";

export const SellerEdit = () => {
  const { t } = useTranslation();
  const params = useParams();

  const { data, isLoading } = useSeller(params.id!);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerDetails />
      <RouteDrawer>
        <RouteDrawer.Header>
          <RouteDrawer.Title>{t("sellers.edit.header")}</RouteDrawer.Title>
        </RouteDrawer.Header>
        {data?.seller && (
          <SellerEditForm seller={data?.seller as unknown as VendorSeller} />
        )}
      </RouteDrawer>
    </>
  );
};
