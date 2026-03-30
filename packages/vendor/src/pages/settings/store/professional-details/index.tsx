import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { RouteDrawer } from "@components/modals";
import { useMe } from "@hooks/api";

import { StoreProfessionalDetailsForm } from "./store-professional-details-form";

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
            {t(
              "store.professionalDetails.edit.header",
              "Edit Professional Details",
            )}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t(
            "store.professionalDetails.edit.description",
            "Update the professional details for your store.",
          )}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {!isPending && seller && (
        <StoreProfessionalDetailsForm seller={seller} />
      )}
    </RouteDrawer>
  );
};
