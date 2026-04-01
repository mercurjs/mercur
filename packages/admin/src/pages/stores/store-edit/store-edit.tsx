import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { StoreEditForm } from "./components/store-edit-form";

export const StoreEdit = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const { seller, isLoading, isError, error } = useSeller(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading className="capitalize">
          {t("stores.edit.header")}
        </Heading>
      </RouteDrawer.Header>
      {!isLoading && seller && <StoreEditForm seller={seller} />}
    </RouteDrawer>
  );
};
