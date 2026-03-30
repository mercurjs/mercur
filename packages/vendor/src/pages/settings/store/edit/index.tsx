import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";
import { EditStoreForm } from "./_components/edit-store-form";

const StoreEdit = () => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();

  const seller = seller_member?.seller;
  const ready = !isPending && !!seller;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading className="capitalize">
          {t("app.menus.store.editStore")}
        </Heading>
      </RouteDrawer.Header>
      {ready && <EditStoreForm seller={seller} />}
    </RouteDrawer>
  );
};

export const Component = StoreEdit;
