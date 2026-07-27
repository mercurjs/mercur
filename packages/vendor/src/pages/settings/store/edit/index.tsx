import { Heading } from "@medusajs/ui";
import { useLinkQuery } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";
import { RouteDrawer } from "@components/modals";
import { useMe, useSeller } from "@hooks/api";
import { EditStoreForm } from "./_components/edit-store-form";

const StoreEdit = () => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();

  const meSeller = seller_member?.seller;

  const query = useLinkQuery("seller");
  const needsLinks = !!query.fields;

  const { seller: linkedSeller, isPending: linkedPending } = useSeller(
    meSeller?.id ?? "",
    query,
    { enabled: needsLinks && !!meSeller?.id },
  );

  const seller = needsLinks ? linkedSeller : meSeller;
  const ready = !isPending && !!seller && (!needsLinks || !linkedPending);

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
