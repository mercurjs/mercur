import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer } from "../../../components/modals";
import { useSeller } from "../../../hooks/api/sellers";
import { StoreProfessionalDetailsForm } from "./components/store-professional-details-form";

export const StoreProfessionalDetailsEdit = () => {
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
            {t(
              "store.professionalDetails.edit.header",
              "Edit Professional Details",
            )}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t(
            "store.professionalDetails.edit.description",
            "Update the professional details for this store.",
          )}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isLoading && seller && (
        <StoreProfessionalDetailsForm seller={seller} />
      )}
    </RouteDrawer>
  );
};
