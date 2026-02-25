import { useParams } from "react-router-dom";

import { RouteDrawer } from "@components/modals";

import { useSeller } from "@hooks/api/sellers";

import { useTranslation } from "react-i18next";
import { SellerEditForm } from "./components/seller-edit-form";
import { SellerDetails } from "../seller-details/components/seller-details";

export const SellerEdit = () => {
  const { t } = useTranslation();
  const params = useParams();

  const { seller, isLoading } = useSeller(params.id!);

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
        {seller && <SellerEditForm seller={seller} />}
      </RouteDrawer>
    </>
  );
};
