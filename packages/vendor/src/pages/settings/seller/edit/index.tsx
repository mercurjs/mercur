import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";
import { EditSellerForm } from "./_components/edit-seller-form";

const SellerEdit = () => {
  const { t } = useTranslation();
  const { seller, isPending, isError, error } = useMe();

  const ready = !isPending && !!seller;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading className="capitalize">
          {t("app.menus.seller.editSeller")}
        </Heading>
      </RouteDrawer.Header>
      {ready && <EditSellerForm seller={seller} />}
    </RouteDrawer>
  );
};

export const Component = SellerEdit;
