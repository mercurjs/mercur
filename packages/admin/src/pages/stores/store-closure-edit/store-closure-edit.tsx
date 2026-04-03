import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { StoreClosureForm } from "./components/store-closure-form";

export const StoreClosureEdit = () => {
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
          <Heading>
            {t("store.scheduledClosure.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("store.scheduledClosure.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && seller && <StoreClosureForm seller={seller} />}
    </RouteDrawer>
  );
};
