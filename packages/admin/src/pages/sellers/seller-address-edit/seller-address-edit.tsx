import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { SellerAddressEditForm } from "./components/seller-address-edit-form";

export const SellerAddressEdit = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const { seller, isLoading, isError, error } = useSeller(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("addresses.title")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && seller && <SellerAddressEditForm seller={seller} />}
    </RouteDrawer>
  );
};
