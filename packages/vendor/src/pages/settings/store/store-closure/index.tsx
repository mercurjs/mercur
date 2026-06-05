import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";

import { StoreClosureForm } from "./store-closure-form";

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
            {t("store.timeOff.create.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("store.timeOff.create.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isPending && seller && <StoreClosureForm seller={seller} />}
    </RouteDrawer>
  );
};
