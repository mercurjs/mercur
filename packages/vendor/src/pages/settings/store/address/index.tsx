import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";

import { StoreAddressForm } from "./store-address-form";

export const Component = () => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();

  const seller = seller_member?.seller;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("store.address.edit.header", "Edit Address")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t(
            "store.address.edit.description",
            "Update the address for your store.",
          )}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isPending && seller && <StoreAddressForm seller={seller} />}
    </RouteDrawer>
  );
};
